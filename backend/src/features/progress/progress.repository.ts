import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";

import { requireDbPool } from "../../config/db.js";

type VideoProgressRow = RowDataPacket & {
  video_id: number;
  last_position_seconds: number;
  is_completed: number;
};

type SubjectProgressSummaryRow = RowDataPacket & {
  subject_id: number;
  total_videos: number;
  completed_videos: number;
};

export const getSubjectProgressMap = async (userId: number, subjectId: number) => {
  const pool = requireDbPool();
  const [rows] = await pool.execute<VideoProgressRow[]>(
    `SELECT
        vp.video_id,
        vp.last_position_seconds,
        vp.is_completed
      FROM video_progress vp
      INNER JOIN videos v ON v.id = vp.video_id
      INNER JOIN sections sec ON sec.id = v.section_id
      WHERE vp.user_id = ?
        AND sec.subject_id = ?`,
    [userId, subjectId]
  );

  return new Map(
    rows.map((row) => [
      row.video_id,
      {
        lastPositionSeconds: row.last_position_seconds,
        isCompleted: Boolean(row.is_completed)
      }
    ])
  );
};

export const listSubjectProgressSummaries = async (userId: number) => {
  const pool = requireDbPool();
  const [rows] = await pool.execute<SubjectProgressSummaryRow[]>(
    `SELECT
        sec.subject_id,
        COUNT(v.id) AS total_videos,
        COUNT(CASE WHEN vp.is_completed = TRUE THEN 1 END) AS completed_videos
      FROM enrollments e
      INNER JOIN sections sec ON sec.subject_id = e.subject_id
      INNER JOIN videos v ON v.section_id = sec.id
      LEFT JOIN video_progress vp
        ON vp.user_id = e.user_id
       AND vp.video_id = v.id
      WHERE e.user_id = ?
      GROUP BY sec.subject_id`,
    [userId]
  );

  return new Map(
    rows.map((row) => {
      const totalVideos = Number(row.total_videos);
      const completedVideos = Number(row.completed_videos);

      return [
        row.subject_id,
        {
          totalVideos,
          completedVideos,
          progressPercent:
            totalVideos === 0
              ? 0
              : Math.round((completedVideos / totalVideos) * 100)
        }
      ];
    })
  );
};

export const findVideoProgress = async (userId: number, videoId: number) => {
  const pool = requireDbPool();
  const [rows] = await pool.execute<
    Array<
      RowDataPacket & {
        last_position_seconds: number;
        is_completed: number;
        completed_at: Date | null;
      }
    >
  >(
    `SELECT last_position_seconds, is_completed, completed_at
     FROM video_progress
     WHERE user_id = ?
       AND video_id = ?
     LIMIT 1`,
    [userId, videoId]
  );

  return rows[0] ?? null;
};

export const getVideoDuration = async (videoId: number) => {
  const pool = requireDbPool();
  const [rows] = await pool.execute<
    Array<RowDataPacket & { duration_seconds: number | null }>
  >(
    `SELECT duration_seconds
     FROM videos
     WHERE id = ?
     LIMIT 1`,
    [videoId]
  );

  return rows[0]?.duration_seconds ?? null;
};

export const upsertVideoProgress = async ({
  userId,
  videoId,
  lastPositionSeconds,
  isCompleted
}: {
  userId: number;
  videoId: number;
  lastPositionSeconds: number;
  isCompleted: boolean;
}) => {
  const pool = requireDbPool();
  const durationSeconds = await getVideoDuration(videoId);
  const cappedPosition =
    durationSeconds && durationSeconds > 0
      ? Math.min(lastPositionSeconds, durationSeconds)
      : lastPositionSeconds;

  await pool.execute<ResultSetHeader>(
    `INSERT INTO video_progress (
        user_id,
        video_id,
        last_position_seconds,
        is_completed,
        completed_at
      )
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        last_position_seconds = GREATEST(last_position_seconds, VALUES(last_position_seconds)),
        is_completed = IF(VALUES(is_completed) = TRUE, TRUE, is_completed),
        completed_at = IF(
          VALUES(is_completed) = TRUE AND completed_at IS NULL,
          CURRENT_TIMESTAMP,
          completed_at
        )`,
    [
      userId,
      videoId,
      cappedPosition,
      isCompleted,
      isCompleted ? new Date() : null
    ]
  );

  return {
    lastPositionSeconds: cappedPosition,
    isCompleted
  };
};

