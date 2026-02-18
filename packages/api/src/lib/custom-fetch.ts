let baseUrl =
  typeof process !== "undefined"
    ? process.env.NEXT_PUBLIC_API_URL || "http://localhost:3011"
    : "http://localhost:3011";

export const setBaseUrl = (url: string) => {
  baseUrl = url;
};

export const getBaseUrl = () => baseUrl;

let adminPassword = "";

export const setAdminPassword = (password: string) => {
  adminPassword = password;
};

export const getAdminPassword = () => adminPassword;

/**
 * Custom fetch function for orval-generated API client.
 * Signature matches orval's expected mutator format: (url, init) => Promise<T>
 */
export const customFetch = async <T>(
  url: string,
  init?: RequestInit
): Promise<T> => {
  const response = await fetch(`${baseUrl}${url}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(adminPassword ? { "X-Admin-Password": adminPassword } : {}),
      ...init?.headers,
    },
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }

  // Handle empty response (204 No Content)
  const contentType = response.headers.get("content-type");
  if (response.status === 204 || !contentType?.includes("application/json")) {
    return { data: undefined, status: response.status, headers: response.headers } as T;
  }

  const data = await response.json();
  return { data, status: response.status, headers: response.headers } as T;
};

export default customFetch;
