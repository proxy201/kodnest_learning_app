import { findEnrollment } from "../enrollments/enrollment.repository.js";
import { getSubjectProgressMap } from "../progress/progress.repository.js";
import { listSubjectVideos } from "../subjects/subject.repository.js";
import { findVideoWithSubjectContext } from "./video.repository.js";

export const getVideoDetails = async (userId: number, videoId: number) => {
  const video = await findVideoWithSubjectContext(videoId);

  if (!video) {
    return { type: "not_found" } as const;
  }

  const enrollment = await findEnrollment(userId, video.subject_id);

  if (!enrollment) {
    return { type: "not_enrolled" } as const;
  }

  const [subjectVideos, progressMap] = await Promise.all([
    listSubjectVideos(video.subject_id),
    getSubjectProgressMap(userId, video.subject_id)
  ]);

  const flattened = subjectVideos.map((row, index) => {
    const previous = subjectVideos[index - 1];
    const progress = progressMap.get(row.video_id);

    return {
      id: row.video_id,
      title: row.video_title,
      sectionId: row.section_id,
      sectionTitle: row.section_title,
      youtubeUrl: row.youtube_url,
      description: row.video_description,
      durationSeconds: row.duration_seconds,
      lastPositionSeconds: progress?.lastPositionSeconds ?? 0,
      isCompleted: progress?.isCompleted ?? false,
      locked: previous
        ? !(progressMap.get(previous.video_id)?.isCompleted ?? false)
        : false
    };
  });

  const currentIndex = flattened.findIndex((item) => item.id === videoId);
  const currentVideo = flattened[currentIndex];

  return {
    type: "ok",
    data: {
      id: currentVideo.id,
      subjectId: video.subject_id,
      subjectTitle: video.subject_title,
      subjectSlug: video.subject_slug,
      sectionId: currentVideo.sectionId,
      sectionTitle: currentVideo.sectionTitle,
      title: currentVideo.title,
      description: currentVideo.description,
      youtubeUrl: currentVideo.youtubeUrl,
      durationSeconds: currentVideo.durationSeconds,
      lastPositionSeconds: currentVideo.lastPositionSeconds,
      isCompleted: currentVideo.isCompleted,
      locked: currentVideo.locked,
      prevVideoId: currentIndex > 0 ? flattened[currentIndex - 1].id : null,
      nextVideoId:
        currentIndex >= 0 && currentIndex < flattened.length - 1
          ? flattened[currentIndex + 1].id
          : null
    }
  } as const;
};

