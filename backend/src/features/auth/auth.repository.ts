import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";

import { requireDbPool } from "../../config/db.js";

export type UserRecord = RowDataPacket & {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: string;
};

export type RefreshTokenRecord = RowDataPacket & {
  id: number;
  user_id: number;
  token_hash: string;
  expires_at: Date;
  revoked_at: Date | null;
};

type CreateUserInput = {
  name: string;
  email: string;
  passwordHash: string;
  role?: string;
};

type RefreshSessionInput = {
  userId: number;
  refreshTokenHash: string;
  refreshTokenExpiresAt: Date;
};

const userSelectFields = `
  id,
  name,
  email,
  password_hash,
  role
`;

export const findUserByEmail = async (email: string) => {
  const pool = requireDbPool();
  const [rows] = await pool.execute<UserRecord[]>(
    `SELECT ${userSelectFields}
     FROM users
     WHERE email = ?
     LIMIT 1`,
    [email]
  );

  return rows[0] ?? null;
};

export const findUserById = async (id: number) => {
  const pool = requireDbPool();
  const [rows] = await pool.execute<UserRecord[]>(
    `SELECT ${userSelectFields}
     FROM users
     WHERE id = ?
     LIMIT 1`,
    [id]
  );

  return rows[0] ?? null;
};

export const createUser = async ({
  name,
  email,
  passwordHash,
  role = "student"
}: CreateUserInput) => {
  const pool = requireDbPool();
  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES (?, ?, ?, ?)`,
    [name, email, passwordHash, role]
  );

  return findUserById(result.insertId);
};

export const createRefreshToken = async ({
  userId,
  refreshTokenHash,
  refreshTokenExpiresAt
}: RefreshSessionInput) => {
  const pool = requireDbPool();
  await pool.execute(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES (?, ?, ?)`,
    [userId, refreshTokenHash, refreshTokenExpiresAt]
  );
};

export const findActiveRefreshToken = async (
  userId: number,
  refreshTokenHash: string
) => {
  const pool = requireDbPool();
  const [rows] = await pool.execute<RefreshTokenRecord[]>(
    `SELECT id, user_id, token_hash, expires_at, revoked_at
     FROM refresh_tokens
     WHERE user_id = ?
       AND token_hash = ?
       AND revoked_at IS NULL
     ORDER BY id DESC
     LIMIT 1`,
    [userId, refreshTokenHash]
  );

  return rows[0] ?? null;
};

export const revokeRefreshTokenByHash = async (refreshTokenHash: string) => {
  const pool = requireDbPool();
  await pool.execute(
    `UPDATE refresh_tokens
     SET revoked_at = CURRENT_TIMESTAMP
     WHERE token_hash = ?
       AND revoked_at IS NULL`,
    [refreshTokenHash]
  );
};

export const revokeAllUserRefreshTokens = async (userId: number) => {
  const pool = requireDbPool();
  await pool.execute(
    `UPDATE refresh_tokens
     SET revoked_at = CURRENT_TIMESTAMP
     WHERE user_id = ?
       AND revoked_at IS NULL`,
    [userId]
  );
};
