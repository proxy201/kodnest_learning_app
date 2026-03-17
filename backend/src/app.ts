import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";

import { checkDatabaseHealth } from "./config/db.js";
import { env } from "./config/env.js";
import { authRouter } from "./routes/auth.js";
import { chatRouter } from "./routes/chat.js";
import { progressRouter } from "./routes/progress.js";
import { subjectsRouter } from "./routes/subjects.js";
import { videosRouter } from "./routes/videos.js";

const allowedOrigins = env.APP_ORIGIN.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export const createApp = () => {
  const app = express();

  app.disable("x-powered-by");

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) {
          callback(null, true);
          return;
        }

        if (allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error("CORS origin is not allowed."));
      },
      credentials: true
    })
  );

  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use("/api/auth", authRouter);
  app.use("/api/chat", chatRouter);
  app.use("/api/subjects", subjectsRouter);
  app.use("/api/videos", videosRouter);
  app.use("/api/progress", progressRouter);

  app.get("/", (_request, response) => {
    response.status(200).json({
      service: "lms-api",
      docs: "/api/auth"
    });
  });

  app.get("/api/health", async (_request, response) => {
    const database = await checkDatabaseHealth();

    response.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      appOrigin: env.APP_ORIGIN,
      database
    });
  });

  return app;
};
