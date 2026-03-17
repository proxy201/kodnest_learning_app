import { Router } from "express";

import { getVideoDetails } from "../features/videos/video.service.js";
import { requireAuth } from "../middleware/require-auth.js";

const videosRouter = Router();

videosRouter.get("/:videoId", requireAuth, async (request, response) => {
  const videoId = Number(request.params.videoId);
  const result = await getVideoDetails(response.locals.user.id, videoId);

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

export { videosRouter };

