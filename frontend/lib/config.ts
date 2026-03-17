export const API_BASE_URL =
  (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

export const APP_URL =
  (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

export const USE_YOUTUBE_NOCOOKIE =
  (process.env.NEXT_PUBLIC_YOUTUBE_NOCOOKIE ?? "true").toLowerCase() !== "false";
