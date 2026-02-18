import * as fs from "fs";
import * as path from "path";

interface OpenAPISpec {
  paths: Record<string, Record<string, Operation>>;
  [key: string]: unknown;
}

interface Operation {
  parameters?: Parameter[];
  [key: string]: unknown;
}

interface Parameter {
  name: string;
  in: string;
  required?: boolean;
  schema?: { type: string; format?: string };
}

function extractPathParams(pathTemplate: string): string[] {
  const matches = pathTemplate.match(/\{([^}]+)\}/g);
  if (!matches) return [];
  return matches.map((m) => m.slice(1, -1));
}

function fixOpenAPISpec(spec: OpenAPISpec): OpenAPISpec {
  const fixedSpec = JSON.parse(JSON.stringify(spec)) as OpenAPISpec;

  for (const [pathTemplate, methods] of Object.entries(fixedSpec.paths)) {
    const requiredParams = extractPathParams(pathTemplate);

    for (const [method, operation] of Object.entries(methods)) {
      if (typeof operation !== "object" || operation === null) continue;

      const existingParams = (operation.parameters || []).filter(
        (p): p is Parameter => typeof p === "object" && p !== null
      );
      const existingParamNames = new Set(
        existingParams.filter((p) => p.in === "path").map((p) => p.name)
      );

      const missingParams = requiredParams.filter(
        (name) => !existingParamNames.has(name)
      );

      if (missingParams.length > 0) {
        console.log(
          `Fixing ${method.toUpperCase()} ${pathTemplate}: adding missing params [${missingParams.join(", ")}]`
        );

        const newParams: Parameter[] = missingParams.map((name) => ({
          name,
          in: "path",
          required: true,
          schema: {
            type: name.toLowerCase().includes("id") ? "integer" : "string",
            ...(name.toLowerCase().includes("id") ? { format: "int64" } : {}),
          },
        }));

        operation.parameters = [...newParams, ...existingParams];
      }
    }
  }

  return fixedSpec;
}

// Main
const fetchedPath = path.resolve(__dirname, "../api-docs.fetched.json");
const localPath = path.resolve(__dirname, "../../../api-docs.json");
const inputPath = fs.existsSync(fetchedPath) ? fetchedPath : localPath;
const outputPath = path.resolve(__dirname, "../api-docs.fixed.json");

console.log(`Reading OpenAPI spec from: ${inputPath}`);

const spec = JSON.parse(fs.readFileSync(inputPath, "utf-8")) as OpenAPISpec;
const fixedSpec = fixOpenAPISpec(spec);

fs.writeFileSync(outputPath, JSON.stringify(fixedSpec, null, 2));
console.log(`\nFixed OpenAPI spec written to: ${outputPath}`);
