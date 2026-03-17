import type { AuthUserPayload } from "../../lib/auth.js";
import { listSubjectProgressSummaries } from "../progress/progress.repository.js";
import {
  createEnrollment,
  findEnrollment,
  listEnrollmentStatesForUser
} from "../enrollments/enrollment.repository.js";
import {
  findSubjectById,
  listPublishedSubjects,
  listSubjectVideos
} from "./subject.repository.js";

type TreeVideo = {
  id: number;
  title: string;
  description: string | null;
  youtube_url: string;
  duration_seconds: number | null;
  order_index: number;
  is_completed: boolean;
  last_position_seconds: number;
  locked: boolean;
};

type TreeSection = {
  id: number;
  title: string;
  order_index: number;
  videos: TreeVideo[];
};

export const getSubjectList = async (user: AuthUserPayload | null) => {
  const subjects = await listPublishedSubjects();

  if (!user) {
    return subjects.map((subject) => ({
      id: subject.id,
      title: subject.title,
      slug: subject.slug,
      description: subject.description,
      thumbnailUrl: subject.thumbnail_url,
      sectionCount: Number(subject.section_count),
      videoCount: Number(subject.video_count),
      isEnrolled: false,
      completedVideos: 0,
      progressPercent: 0
    }));
  }

  const [enrollmentSet, progressMap] = await Promise.all([
    listEnrollmentStatesForUser(user.id),
    listSubjectProgressSummaries(user.id)
  ]);

  return subjects.map((subject) => {
    const progress = progressMap.get(subject.id);

    return {
      id: subject.id,
      title: subject.title,
      slug: subject.slug,
      description: subject.description,
      thumbnailUrl: subject.thumbnail_url,
      sectionCount: Number(subject.section_count),
      videoCount: Number(subject.video_count),
      isEnrolled: enrollmentSet.has(subject.id),
      completedVideos: progress?.completedVideos ?? 0,
      progressPercent: progress?.progressPercent ?? 0
    };
  });
};

export const getSubjectDetail = async (
  subjectId: number,
  user: AuthUserPayload | null
) => {
  const subject = await findSubjectById(subjectId);

  if (!subject || !subject.is_published) {
    return null;
  }

  const rows = await listSubjectVideos(subjectId);
  const sections = rows.reduce<
    Array<{
      id: number;
      title: string;
      order_index: number;
      videos: Array<{
        id: number;
        title: string;
        order_index: number;
        duration_seconds: number | null;
      }>;
    }>
  >((accumulator, row) => {
    let section = accumulator.find((item) => item.id === row.section_id);

    if (!section) {
      section = {
        id: row.section_id,
        title: row.section_title,
        order_index: row.section_order_index,
        videos: []
      };
      accumulator.push(section);
    }

    section.videos.push({
      id: row.video_id,
      title: row.video_title,
      order_index: row.video_order_index,
      duration_seconds: row.duration_seconds
    });

    return accumulator;
  }, []);

  const enrollment = user ? await findEnrollment(user.id, subjectId) : null;

  return {
    id: subject.id,
    title: subject.title,
    slug: subject.slug,
    description: subject.description,
    thumbnailUrl: subject.thumbnail_url,
    isEnrolled: Boolean(enrollment),
    sections
  };
};

export const enrollUserInSubject = async (userId: number, subjectId: number) => {
  const subject = await findSubjectById(subjectId);

  if (!subject || !subject.is_published) {
    return null;
  }

  await createEnrollment(userId, subjectId);

  return {
    id: subject.id,
    title: subject.title,
    slug: subject.slug
  };
};

export const getSubjectTree = async (
  userId: number,
  subjectId: number,
  progressMap: Map<number, { lastPositionSeconds: number; isCompleted: boolean }>
) => {
  const enrollment = await findEnrollment(userId, subjectId);

  if (!enrollment) {
    return { type: "not_enrolled" } as const;
  }

  const subject = await findSubjectById(subjectId);

  if (!subject || !subject.is_published) {
    return { type: "not_found" } as const;
  }

  const rows = await listSubjectVideos(subjectId);
  const sections: TreeSection[] = [];
  const sectionMap = new Map<number, TreeSection>();
  let previousCompleted = true;

  for (const row of rows) {
    let section = sectionMap.get(row.section_id);

    if (!section) {
      section = {
        id: row.section_id,
        title: row.section_title,
        order_index: row.section_order_index,
        videos: []
      };
      sectionMap.set(row.section_id, section);
      sections.push(section);
    }

    const progress = progressMap.get(row.video_id);
    const isCompleted = progress?.isCompleted ?? false;
    const locked = sections.length === 1 && section.videos.length === 0
      ? false
      : !previousCompleted;

    section.videos.push({
      id: row.video_id,
      title: row.video_title,
      description: row.video_description,
      youtube_url: row.youtube_url,
      duration_seconds: row.duration_seconds,
      order_index: row.video_order_index,
      is_completed: isCompleted,
      last_position_seconds: progress?.lastPositionSeconds ?? 0,
      locked
    });

    previousCompleted = isCompleted;
  }

  return {
    type: "ok",
    data: {
      id: subject.id,
      title: subject.title,
      slug: subject.slug,
      description: subject.description,
      sections
    }
  } as const;
};
