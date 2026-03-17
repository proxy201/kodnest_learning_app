import type { RowDataPacket } from "mysql2/promise";

import { requireDbPool } from "../../config/db.js";

export type SubjectListRow = RowDataPacket & {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  is_published: number;
  thumbnail_url: string | null;
  section_count: number;
  video_count: number;
};

export type SubjectDetailRow = RowDataPacket & {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  is_published: number;
  thumbnail_url: string | null;
};

export type SubjectVideoRow = RowDataPacket & {
  subject_id: number;
  section_id: number;
  section_title: string;
  section_order_index: number;
  video_id: number;
  video_title: string;
  video_description: string | null;
  youtube_url: string;
  duration_seconds: number | null;
  video_order_index: number;
};

export const listPublishedSubjects = async () => {
  const pool = requireDbPool();
  const [rows] = await pool.query<SubjectListRow[]>(
    `SELECT
        s.id,
        s.title,
        s.slug,
        s.description,
        s.is_published,
        s.thumbnail_url,
        COUNT(DISTINCT sec.id) AS section_count,
        COUNT(v.id) AS video_count
      FROM subjects s
      LEFT JOIN sections sec ON sec.subject_id = s.id
      LEFT JOIN videos v ON v.section_id = sec.id
      WHERE s.is_published = TRUE
      GROUP BY s.id
      ORDER BY s.created_at DESC`
  );

  return rows;
};

export const findSubjectById = async (subjectId: number) => {
  const pool = requireDbPool();
  const [rows] = await pool.execute<SubjectDetailRow[]>(
    `SELECT id, title, slug, description, is_published, thumbnail_url
     FROM subjects
     WHERE id = ?
     LIMIT 1`,
    [subjectId]
  );

  return rows[0] ?? null;
};

export const listSubjectVideos = async (subjectId: number) => {
  const pool = requireDbPool();
  const [rows] = await pool.execute<SubjectVideoRow[]>(
    `SELECT
        s.id AS subject_id,
        sec.id AS section_id,
        sec.title AS section_title,
        sec.order_index AS section_order_index,
        v.id AS video_id,
        v.title AS video_title,
        v.description AS video_description,
        v.youtube_url,
        v.duration_seconds,
        v.order_index AS video_order_index
      FROM subjects s
      INNER JOIN sections sec ON sec.subject_id = s.id
      INNER JOIN videos v ON v.section_id = sec.id
      WHERE s.id = ?
      ORDER BY sec.order_index ASC, v.order_index ASC`,
    [subjectId]
  );

  return rows;
};

