import * as fs from "fs";
import * as path from "path";

interface FetchOptions {
  timeout?: number;
  authType?: "bearer" | "basic" | "api-key";
  authToken?: string;
  authUsername?: string;
  authPassword?: string;
  apiKeyName?: string;
  apiKeyValue?: string;
}

interface OpenAPISpec {
  openapi?: string;
  swagger?: string;
  info: { title: string; version: string };
  paths: Record<string, unknown>;
  [key: string]: unknown;
}

const DEFAULT_TIMEOUT = 30000;
const LOCAL_FALLBACK_PATH = path.resolve(__dirname, "../../../api-docs.json");
const OUTPUT_PATH = path.resolve(__dirname, "../api-docs.fetched.json");

const COMMON_SPEC_PATHS = [
  "/v3/api-docs",
  "/v2/api-docs",
  "/api-docs",
  "/swagger.json",
  "/openapi.json",
];

function getOptionsFromEnv(): FetchOptions {
  return {
    timeout: parseInt(
      process.env.SWAGGER_FETCH_TIMEOUT || String(DEFAULT_TIMEOUT)
    ),
    authType: process.env.SWAGGER_AUTH_TYPE as FetchOptions["authType"],
    authToken: process.env.SWAGGER_AUTH_TOKEN,
    authUsername: process.env.SWAGGER_AUTH_USERNAME,
    authPassword: process.env.SWAGGER_AUTH_PASSWORD,
    apiKeyName: process.env.SWAGGER_API_KEY_NAME,
    apiKeyValue: process.env.SWAGGER_API_KEY_VALUE,
  };
}

function buildAuthHeaders(options: FetchOptions): HeadersInit {
  const headers: HeadersInit = {};

  switch (options.authType) {
    case "bearer":
      if (options.authToken) {
        headers["Authorization"] = `Bearer ${options.authToken}`;
      }
      break;
    case "basic":
      if (options.authUsername && options.authPassword) {
        const credentials = Buffer.from(
          `${options.authUsername}:${options.authPassword}`
        ).toString("base64");
        headers["Authorization"] = `Basic ${credentials}`;
      }
      break;
    case "api-key":
      if (options.apiKeyName && options.apiKeyValue) {
        headers[options.apiKeyName] = options.apiKeyValue;
      }
      break;
  }

  return headers;
}

function extractSpecURLFromSwaggerUI(
  html: string,
  baseUrl: string
): string | null {
  const urlPatterns = [
    /url\s*:\s*["']([^"']+)["']/,
    /configUrl\s*:\s*["']([^"']+)["']/,
    /"url"\s*:\s*"([^"]+)"/,
  ];

  for (const pattern of urlPatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      const specUrl = match[1];
      if (specUrl.startsWith("/")) {
        return new URL(specUrl, baseUrl).href;
      }
      if (specUrl.startsWith("http")) {
        return specUrl;
      }
      return new URL(specUrl, baseUrl).href;
    }
  }

  return null;
}

function validateOpenAPISpec(spec: unknown): asserts spec is OpenAPISpec {
  if (typeof spec !== "object" || spec === null) {
    throw new Error("Invalid OpenAPI spec: not an object");
  }

  const s = spec as Record<string, unknown>;

  if (!s.openapi && !s.swagger) {
    throw new Error("Invalid OpenAPI spec: missing 'openapi' or 'swagger' field");
  }

  if (!s.info || typeof s.info !== "object") {
    throw new Error("Invalid OpenAPI spec: missing 'info' field");
  }

  if (!s.paths || typeof s.paths !== "object") {
    throw new Error("Invalid OpenAPI spec: missing 'paths' field");
  }
}

async function fetchOpenAPISpec(
  url: string,
  options: FetchOptions
): Promise<OpenAPISpec> {
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    options.timeout || DEFAULT_TIMEOUT
  );

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json, text/html",
        ...buildAuthHeaders(options),
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const spec = await response.json();
      validateOpenAPISpec(spec);
      return spec;
    }

    if (contentType.includes("text/html")) {
      const html = await response.text();
      const specUrl = extractSpecURLFromSwaggerUI(html, url);

      if (specUrl) {
        console.log(`Found spec URL in Swagger UI: ${specUrl}`);
        return fetchOpenAPISpec(specUrl, options);
      }

      const baseUrl = new URL(url).origin;
      for (const specPath of COMMON_SPEC_PATHS) {
        try {
          const tryUrl = `${baseUrl}${specPath}`;
          console.log(`Trying common path: ${tryUrl}`);
          return await fetchOpenAPISpec(tryUrl, options);
        } catch {
          continue;
        }
      }

      throw new Error(
        "Could not extract OpenAPI spec URL from Swagger UI page"
      );
    }

    throw new Error(`Unexpected content type: ${contentType}`);
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

function useLocalFallback(): void {
  if (!fs.existsSync(LOCAL_FALLBACK_PATH)) {
    console.error(`Local fallback file not found: ${LOCAL_FALLBACK_PATH}`);
    console.error("Please either set SWAGGER_URL or provide api-docs.json");
    process.exit(1);
  }

  const spec = JSON.parse(fs.readFileSync(LOCAL_FALLBACK_PATH, "utf-8"));
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(spec, null, 2));
  console.log(`Using local file, copied to: ${OUTPUT_PATH}`);
}

async function main() {
  const swaggerUrl = process.env.SWAGGER_URL;

  if (!swaggerUrl) {
    console.log("SWAGGER_URL not set, using local file fallback...");
    return useLocalFallback();
  }

  try {
    console.log(`Fetching OpenAPI spec from: ${swaggerUrl}`);
    const spec = await fetchOpenAPISpec(swaggerUrl, getOptionsFromEnv());

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(spec, null, 2));
    console.log(`OpenAPI spec written to: ${OUTPUT_PATH}`);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    console.error(`Failed to fetch from URL: ${errorMessage}`);
    console.log("Falling back to local file...");
    return useLocalFallback();
  }
}

main().catch((error) => {
  console.error("Fatal error:", error.message);
  process.exit(1);
});
