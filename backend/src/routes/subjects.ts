import { Router } from "express";

import { getSubjectProgressMap } from "../features/progress/progress.repository.js";
import {
  enrollUserInSubject,
  getSubjectDetail,
  getSubjectList,
  getSubjectTree
} from "../features/subjects/subject.service.js";
import { requireAuth } from "../middleware/require-auth.js";
import { optionalAuth } from "../middleware/optional-auth.js";

const subjectsRouter = Router();

subjectsRouter.get("/", optionalAuth, async (_request, response) => {
  const subjects = await getSubjectList(response.locals.user ?? null);
  response.status(200).json({ subjects });
});

subjectsRouter.get("/:subjectId", optionalAuth, async (request, response) => {
  const subjectId = Number(request.params.subjectId);
  const subject = await getSubjectDetail(subjectId, response.locals.user ?? null);

  if (!subject) {
    response.status(404).json({ message: "Subject not found." });
    return;
  }

  response.status(200).json(subject);
});

subjectsRouter.post("/:subjectId/enroll", requireAuth, async (request, response) => {
  const subjectId = Number(request.params.subjectId);
  const subject = await enrollUserInSubject(response.locals.user.id, subjectId);

  if (!subject) {
    response.status(404).json({ message: "Subject not found." });
    return;
  }

  response.status(200).json({
    message: "Enrollment successful.",
    subject
  });
});

subjectsRouter.get("/:subjectId/tree", requireAuth, async (request, response) => {
  const subjectId = Number(request.params.subjectId);
  const progressMap = await getSubjectProgressMap(response.locals.user.id, subjectId);
  const tree = await getSubjectTree(response.locals.user.id, subjectId, progressMap);

  if (tree.type === "not_found") {
    response.status(404).json({ message: "Subject not found." });
    return;
  }

  if (tree.type === "not_enrolled") {
    response.status(403).json({ message: "Enroll in this subject first." });
    return;
  }

  response.status(200).json(tree.data);
});

subjectsRouter.get("/:subjectId/first-video", requireAuth, async (request, response) => {
  const subjectId = Number(request.params.subjectId);
  const progressMap = await getSubjectProgressMap(response.locals.user.id, subjectId);
  const tree = await getSubjectTree(response.locals.user.id, subjectId, progressMap);

  if (tree.type === "not_found") {
    response.status(404).json({ message: "Subject not found." });
    return;
  }

  if (tree.type === "not_enrolled") {
    response.status(403).json({ message: "Enroll in this subject first." });
    return;
  }

  const unlockedVideo = tree.data.sections
    .flatMap((section) => section.videos)
    .find((video) => !video.locked);

  response.status(200).json({
    videoId: unlockedVideo?.id ?? null
  });
});

export { subjectsRouter };

