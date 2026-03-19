import dotenv from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirPath = dirname(currentFilePath);
const envFilePath = resolve(currentDirPath, "../../.env");

dotenv.config({ path: envFilePath });

const parseBoolean = (value: string | undefined, fallback = false): boolean => {
  if (!value) {
    return fallback;
  }

  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
};

const parseNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const pickString = (...values: Array<string | undefined>): string =>
  values.find((value) => typeof value === "string" && value.trim().length > 0)?.trim() ?? "";

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: parseNumber(process.env.PORT, 4000),
  APP_ORIGIN: process.env.APP_ORIGIN ?? "http://localhost:3000",
  MYSQL_HOST: process.env.MYSQL_HOST ?? "",
  MYSQL_PORT: parseNumber(process.env.MYSQL_PORT, 3306),
  MYSQL_USER: process.env.MYSQL_USER ?? "",
  MYSQL_PASSWORD: process.env.MYSQL_PASSWORD ?? "",
  MYSQL_DATABASE: process.env.MYSQL_DATABASE ?? "",
  MYSQL_SSL: parseBoolean(process.env.MYSQL_SSL, false),
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET ?? "",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ?? "",
  JWT_ACCESS_EXPIRES: process.env.JWT_ACCESS_EXPIRES ?? "15m",
  JWT_REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES ?? "30d",
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? "",
  HUGGING_FACE_API_KEY: pickString(
    process.env.HUGGING_FACE_API_KEY,
    process.env.HF_TOKEN
  ),
  HUGGING_FACE_MODEL: pickString(
    process.env.HUGGING_FACE_MODEL,
    process.env.HF_MODEL,
    "Qwen/Qwen2.5-7B-Instruct"
  )
} as const;

export const isProduction = env.NODE_ENV === "production";

export const hasDatabaseConfig = [
  env.MYSQL_HOST,
  env.MYSQL_USER,
  env.MYSQL_PASSWORD,
  env.MYSQL_DATABASE
].every(Boolean);
