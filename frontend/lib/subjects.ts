import { apiFetch, buildAuthHeaders } from "./api";

export type SubjectSummary = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  thumbnailUrl: string | null;
  sectionCount: number;
  videoCount: number;
  isEnrolled: boolean;
  completedVideos: number;
  progressPercent: number;
};

export type SubjectDetail = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  thumbnailUrl: string | null;
  isEnrolled: boolean;
  sections: Array<{
    id: number;
    title: string;
    order_index: number;
    videos: Array<{
      id: number;
      title: string;
      order_index: number;
      duration_seconds: number | null;
    }>;
  }>;
};

export type SubjectTree = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  sections: Array<{
    id: number;
    title: string;
    order_index: number;
    videos: Array<{
      id: number;
      title: string;
      description: string | null;
      youtube_url: string;
      duration_seconds: number | null;
      order_index: number;
      is_completed: boolean;
      last_position_seconds: number;
      locked: boolean;
    }>;
  }>;
};

export type VideoDetail = {
  id: number;
  subjectId: number;
  subjectTitle: string;
  subjectSlug: string;
  sectionId: number;
  sectionTitle: string;
  title: string;
  description: string | null;
  youtubeUrl: string;
  durationSeconds: number | null;
  lastPositionSeconds: number;
  isCompleted: boolean;
  locked: boolean;
  prevVideoId: number | null;
  nextVideoId: number | null;
};

export type SubjectProgress = {
  totalVideos: number;
  completedVideos: number;
  progressPercent: number;
};

export type VideoProgress = {
  lastPositionSeconds: number;
  isCompleted: boolean;
  completedAt: string | null;
};

export const fetchSubjects = (accessToken?: string | null) =>
  apiFetch<{ subjects: SubjectSummary[] }>("/api/subjects", {
    headers: buildAuthHeaders(accessToken)
  });

export const fetchSubjectDetail = (subjectId: number, accessToken?: string | null) =>
  apiFetch<SubjectDetail>(`/api/subjects/${subjectId}`, {
    headers: buildAuthHeaders(accessToken)
  });

export const enrollInSubject = (subjectId: number, accessToken: string) =>
  apiFetch<{ message: string; subject: { id: number; title: string; slug: string } }>(
    `/api/subjects/${subjectId}/enroll`,
    {
      method: "POST",
      headers: buildAuthHeaders(accessToken)
    }
  );

export const fetchSubjectTree = (subjectId: number, accessToken: string) =>
  apiFetch<SubjectTree>(`/api/subjects/${subjectId}/tree`, {
    headers: buildAuthHeaders(accessToken)
  });

export const fetchFirstVideo = (subjectId: number, accessToken: string) =>
  apiFetch<{ videoId: number | null }>(`/api/subjects/${subjectId}/first-video`, {
    headers: buildAuthHeaders(accessToken)
  });

export const fetchVideoDetail = (videoId: number, accessToken: string) =>
  apiFetch<VideoDetail>(`/api/videos/${videoId}`, {
    headers: buildAuthHeaders(accessToken)
  });

export const fetchSubjectProgress = (subjectId: number, accessToken: string) =>
  apiFetch<SubjectProgress>(`/api/progress/subjects/${subjectId}`, {
    headers: buildAuthHeaders(accessToken)
  });

export const fetchVideoProgress = (videoId: number, accessToken: string) =>
  apiFetch<VideoProgress>(`/api/progress/videos/${videoId}`, {
    headers: buildAuthHeaders(accessToken)
  });

export const saveVideoProgress = (
  videoId: number,
  accessToken: string,
  payload: { lastPositionSeconds: number; isCompleted: boolean }
) =>
  apiFetch<{ lastPositionSeconds: number; isCompleted: boolean }>(
    `/api/progress/videos/${videoId}`,
    {
      method: "POST",
      headers: buildAuthHeaders(accessToken),
      body: JSON.stringify(payload)
    }
  );

