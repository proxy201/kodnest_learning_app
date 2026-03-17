import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";

import { requireDbPool } from "../../config/db.js";

type EnrollmentRow = RowDataPacket & {
  id: number;
  user_id: number;
  subject_id: number;
};

export const findEnrollment = async (userId: number, subjectId: number) => {
  const pool = requireDbPool();
  const [rows] = await pool.execute<EnrollmentRow[]>(
    `SELECT id, user_id, subject_id
     FROM enrollments
     WHERE user_id = ?
       AND subject_id = ?
     LIMIT 1`,
    [userId, subjectId]
  );

  return rows[0] ?? null;
};

export const createEnrollment = async (userId: number, subjectId: number) => {
  const pool = requireDbPool();
  await pool.execute<ResultSetHeader>(
    `INSERT INTO enrollments (user_id, subject_id)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE subject_id = VALUES(subject_id)`,
    [userId, subjectId]
  );
};

export const listEnrollmentStatesForUser = async (userId: number) => {
  const pool = requireDbPool();
  const [rows] = await pool.execute<Array<RowDataPacket & { subject_id: number }>>(
    `SELECT subject_id
     FROM enrollments
     WHERE user_id = ?`,
    [userId]
  );

  return new Set(rows.map((row) => row.subject_id));
};

