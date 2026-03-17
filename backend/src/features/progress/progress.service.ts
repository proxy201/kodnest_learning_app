import { findEnrollment } from "../enrollments/enrollment.repository.js";
import { findVideoWithSubjectContext } from "../videos/video.repository.js";
import {
  findVideoProgress,
  listSubjectProgressSummaries,
  upsertVideoProgress
} from "./progress.repository.js";

export const getSubjectProgress = async (userId: number, subjectId: number) => {
  const enrollment = await findEnrollment(userId, subjectId);

  if (!enrollment) {
    return { type: "not_enrolled" } as const;
  }

  const progressMap = await listSubjectProgressSummaries(userId);

  return {
    type: "ok",
    data: progressMap.get(subjectId) ?? {
      totalVideos: 0,
      completedVideos: 0,
      progressPercent: 0
    }
  } as const;
};

export const getVideoProgress = async (userId: number, videoId: number) => {
  const video = await findVideoWithSubjectContext(videoId);

  if (!video) {
    return { type: "not_found" } as const;
  }

  const enrollment = await findEnrollment(userId, video.subject_id);

  if (!enrollment) {
    return { type: "not_enrolled" } as const;
  }

  const progress = await findVideoProgress(userId, videoId);

  return {
    type: "ok",
    data: {
      lastPositionSeconds: progress?.last_position_seconds ?? 0,
      isCompleted: Boolean(progress?.is_completed),
      completedAt: progress?.completed_at ?? null
    }
  } as const;
};

export const saveVideoProgress = async ({
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
  const video = await findVideoWithSubjectContext(videoId);

  if (!video) {
    return { type: "not_found" } as const;
  }

  const enrollment = await findEnrollment(userId, video.subject_id);

  if (!enrollment) {
    return { type: "not_enrolled" } as const;
  }

  const saved = await upsertVideoProgress({
    userId,
    videoId,
    lastPositionSeconds,
    isCompleted
  });

  return {
    type: "ok",
    data: saved
  } as const;
};

