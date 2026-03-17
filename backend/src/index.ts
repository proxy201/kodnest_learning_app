import { createApp } from "./app.js";
import { ensureDatabaseSchema } from "./config/db.js";
import { env } from "./config/env.js";

const bootstrap = async () => {
  await ensureDatabaseSchema();

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    console.log(`LMS API listening on port ${env.PORT}`);
  });

  const shutdown = (signal: string) => {
    console.log(`Received ${signal}. Closing server.`);

    server.close((error) => {
      if (error) {
        console.error("Failed to close server cleanly.", error);
        process.exit(1);
      }

      process.exit(0);
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
};

bootstrap().catch((error) => {
  console.error("Failed to start LMS API.");
  console.error(error);
  process.exit(1);
});
