import mysql, {
  type ConnectionOptions,
  type Pool,
  type PoolOptions,
  type RowDataPacket
} from "mysql2/promise";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

import { env, hasDatabaseConfig } from "./env.js";

let pool: Pool | null = null;
let schemaReady = false;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const candidateSqlDirs = [
  path.resolve(__dirname, "../sql"),
  path.resolve(__dirname, "../../src/sql")
];

const resolveSqlDir = async () => {
  for (const directory of candidateSqlDirs) {
    try {
      await fs.access(directory);
      return directory;
    } catch {
      // Try the next candidate path.
    }
  }

  throw new Error("Unable to locate SQL migration directory.");
};

const buildPoolConfig = (): PoolOptions => ({
  host: env.MYSQL_HOST,
  port: env.MYSQL_PORT,
  user: env.MYSQL_USER,
  password: env.MYSQL_PASSWORD,
  database: env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: env.MYSQL_SSL ? { rejectUnauthorized: false } : undefined
});

export const buildDbConnectionConfig = (
  overrides: Partial<ConnectionOptions> = {}
): ConnectionOptions => ({
  host: env.MYSQL_HOST,
  port: env.MYSQL_PORT,
  user: env.MYSQL_USER,
  password: env.MYSQL_PASSWORD,
  database: env.MYSQL_DATABASE,
  ssl: env.MYSQL_SSL ? { rejectUnauthorized: false } : undefined,
  ...overrides
});

export const getDbPool = (): Pool | null => {
  if (!hasDatabaseConfig) {
    return null;
  }

  if (!pool) {
    pool = mysql.createPool(buildPoolConfig());
  }

  return pool;
};

export const requireDbPool = (): Pool => {
  const activePool = getDbPool();

  if (!activePool) {
    throw new Error("Database environment variables are not configured.");
  }

  return activePool;
};

export const ensureDatabaseSchema = async () => {
  if (schemaReady || !hasDatabaseConfig) {
    return;
  }

  const sqlDir = await resolveSqlDir();
  const files = (await fs.readdir(sqlDir))
    .filter((file) => file.endsWith(".sql"))
    .sort((left, right) => left.localeCompare(right));

  if (files.length === 0) {
    schemaReady = true;
    return;
  }

  const connection = await mysql.createConnection(
    buildDbConnectionConfig({
      multipleStatements: true
    })
  );

  try {
    for (const file of files) {
      const fullPath = path.join(sqlDir, file);
      const sql = await fs.readFile(fullPath, "utf8");
      await connection.query(sql);
    }

    schemaReady = true;
  } finally {
    await connection.end();
  }
};

export const checkDatabaseHealth = async () => {
  const activePool = getDbPool();

  if (!activePool) {
    return {
      status: "skipped",
      message: "Database environment variables are not configured yet."
    } as const;
  }

  try {
    await activePool.query<RowDataPacket[]>("SELECT 1 AS ok");

    return {
      status: "up",
      message: "Database connection established."
    } as const;
  } catch (error) {
    return {
      status: "down",
      message: error instanceof Error ? error.message : "Unknown database error."
    } as const;
  }
};
