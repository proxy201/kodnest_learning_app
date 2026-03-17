import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

import mysql from "mysql2/promise";

import { buildDbConnectionConfig } from "../config/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.resolve(__dirname, "../sql");

const run = async () => {
  const files = (await fs.readdir(migrationsDir))
    .filter((file) => file.endsWith(".sql"))
    .sort((left, right) => left.localeCompare(right));

  if (files.length === 0) {
    console.log("No migration files found.");
    return;
  }

  const connection = await mysql.createConnection(
    buildDbConnectionConfig({
      multipleStatements: true
    })
  );

  try {
    for (const file of files) {
      const fullPath = path.join(migrationsDir, file);
      const sql = await fs.readFile(fullPath, "utf8");

      await connection.query(sql);
      console.log(`Applied migration: ${file}`);
    }
  } finally {
    await connection.end();
  }
};

run().catch((error) => {
  console.error("Migration failed.");
  console.error(error);
  process.exit(1);
});

