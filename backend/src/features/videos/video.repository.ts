import type { RowDataPacket } from "mysql2/promise";

import { requireDbPool } from "../../config/db.js";

export type VideoDetailRow = RowDataPacket & {
  subject_id: number;
  subject_title: string;
  subject_slug: string;
  section_id: number;
  section_title: string;
  video_id: number;
  video_title: string;
  video_description: string | null;
  youtube_url: string;
  duration_seconds: number | null;
};

export const findVideoWithSubjectContext = async (videoId: number) => {
  const pool = requireDbPool();
  const [rows] = await pool.execute<VideoDetailRow[]>(
    `SELECT
        s.id AS subject_id,
        s.title AS subject_title,
        s.slug AS subject_slug,
        sec.id AS section_id,
        sec.title AS section_title,
        v.id AS video_id,
        v.title AS video_title,
        v.description AS video_description,
        v.youtube_url,
        v.duration_seconds
      FROM videos v
      INNER JOIN sections sec ON sec.id = v.section_id
      INNER JOIN subjects s ON s.id = sec.subject_id
      WHERE v.id = ?
      LIMIT 1`,
    [videoId]
  );

  return rows[0] ?? null;
};

