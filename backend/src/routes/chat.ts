import { type Request, type Response, Router } from "express";
import { ZodError } from "zod";

import {
  ChatConfigError,
  createProjectChatReply
} from "../features/chat/chat.service.js";
import {
  chatRequestSchema,
  normalizeChatMessages
} from "../features/chat/chat.schema.js";
import { optionalAuth } from "../middleware/optional-auth.js";

const chatRouter = Router();

const handleChat = async (request: Request, response: Response) => {
  try {
    const input = chatRequestSchema.parse(request.body ?? {});
    const messages = normalizeChatMessages(input);
    const reply = await createProjectChatReply({
      messages,
      user: response.locals.user ?? null
    });

    response.status(200).json({
      success: true,
      reply,
      response: reply,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error instanceof ZodError) {
      response.status(400).json({
        success: false,
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
        success: false,
        message: error.message
      });
      return;
    }

    response.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Unable to answer right now."
    });
  }
};

chatRouter.post("/", optionalAuth, handleChat);
chatRouter.post("/ask", optionalAuth, handleChat);

export { chatRouter };
