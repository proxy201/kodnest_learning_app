import { Router } from "express";
import { z, ZodError } from "zod";

import {
  getSubjectProgress,
  getVideoProgress,
  saveVideoProgress
} from "../features/progress/progress.service.js";
import { requireAuth } from "../middleware/require-auth.js";

const progressRouter = Router();

const videoProgressSchema = z.object({
  lastPositionSeconds: z.number().int().min(0).default(0),
  isCompleted: z.boolean().default(false)
});

progressRouter.get("/subjects/:subjectId", requireAuth, async (request, response) => {
  const subjectId = Number(request.params.subjectId);
  const result = await getSubjectProgress(response.locals.user.id, subjectId);

  if (result.type === "not_enrolled") {
    response.status(403).json({ message: "Enroll in this subject first." });
    return;
  }

  response.status(200).json(result.data);
});

progressRouter.get("/videos/:videoId", requireAuth, async (request, response) => {
  const videoId = Number(request.params.videoId);
  const result = await getVideoProgress(response.locals.user.id, videoId);

  if (result.type === "not_found") {
    response.status(404).json({ message: "Video not found." });
    return;
  }

  if (result.type === "not_enrolled") {
    response.status(403).json({ message: "Enroll in this subject first." });
    return;
  }

  response.status(200).json(result.data);
});

progressRouter.post("/videos/:videoId", requireAuth, async (request, response) => {
  try {
    const videoId = Number(request.params.videoId);
    const input = videoProgressSchema.parse(request.body ?? {});
    const result = await saveVideoProgress({
      userId: response.locals.user.id,
      videoId,
      lastPositionSeconds: input.lastPositionSeconds,
      isCompleted: input.isCompleted
    });

    if (result.type === "not_found") {
      response.status(404).json({ message: "Video not found." });
      return;
    }

    if (result.type === "not_enrolled") {
      response.status(403).json({ message: "Enroll in this subject first." });
      return;
    }

    response.status(200).json(result.data);
  } catch (error) {
    if (error instanceof ZodError) {
      response.status(400).json({
        message: "Validation failed.",
        issues: error.issues
      });
      return;
    }

    response.status(500).json({
      message: error instanceof Error ? error.message : "Unable to save progress."
    });
  }
});

export { progressRouter };

