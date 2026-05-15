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
    const message =
      error?.resultMsg ||
      error?.message ||
      error?.error ||
      `HTTP error! status: ${response.status}`;
    throw new Error(message);
  }

  // Handle empty response (204 No Content)
  if (response.status === 204) {
    return { data: undefined, status: response.status, headers: response.headers } as T;
  }

  // Content-Type에 무관하게 JSON 파싱 시도 (서버가 */* 등으로 응답할 수 있음)
  try {
    const data = await response.json();
    return { data, status: response.status, headers: response.headers } as T;
  } catch {
    return { data: undefined, status: response.status, headers: response.headers } as T;
  }
};

export default customFetch;
