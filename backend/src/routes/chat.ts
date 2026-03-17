import { Router } from "express";
import { ZodError } from "zod";

import {
  ChatConfigError,
  createProjectChatReply
} from "../features/chat/chat.service.js";
import { chatRequestSchema } from "../features/chat/chat.schema.js";
import { optionalAuth } from "../middleware/optional-auth.js";

const chatRouter = Router();

chatRouter.post("/", optionalAuth, async (request, response) => {
  try {
    const input = chatRequestSchema.parse(request.body ?? {});
    const reply = await createProjectChatReply({
      messages: input.messages,
      user: response.locals.user ?? null
    });

    response.status(200).json({ reply });
  } catch (error) {
    if (error instanceof ZodError) {
      response.status(400).json({
        message: "Validation failed.",
        issues: error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message
        }))
      });
      return;
    }

    if (error instanceof ChatConfigError) {
      response.status(error.status).json({
        message: error.message
      });
      return;
    }

    response.status(500).json({
      message: error instanceof Error ? error.message : "Unable to answer right now."
    });
  }
});

export { chatRouter };
