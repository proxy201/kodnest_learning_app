const fallbackApiUrl = "";

export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export const getApiBaseUrl = () =>
  (process.env.NEXT_PUBLIC_API_URL ?? fallbackApiUrl).replace(/\/$/, "");

export const buildAuthHeaders = (
  accessToken?: string | null
): Record<string, string> =>
  accessToken
    ? {
        Authorization: `Bearer ${accessToken}`
      }
    : {};

const toAbsoluteUrl = (path: string) =>
  `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;

type JsonBody = BodyInit | null | undefined;

export const apiFetch = async <T>(
  path: string,
  init: RequestInit = {}
): Promise<T> => {
  const headers = new Headers(init.headers);
  const body = init.body as JsonBody;

  if (body && !(body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  const response = await fetch(toAbsoluteUrl(path), {
    ...init,
    credentials: "include",
    headers
  });

  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    const message =
      payload &&
      typeof payload === "object" &&
      "message" in payload &&
      typeof payload.message === "string"
        ? payload.message
        : `API request failed with status ${response.status}`;

    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
};
