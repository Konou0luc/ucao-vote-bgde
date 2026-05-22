import { app } from "./app";
import { env } from "./config/env";
import { logger } from "./infrastructure/logger/logger";

const isVercel = process.env.VERCEL === "1";

if (!isVercel) {
  const server = app.listen(env.PORT, () => {
    logger.info(`Server running on http://localhost:${env.PORT}`);
    logger.info(`Swagger docs on http://localhost:${env.PORT}/api/docs`);
  });
  
  // Augmenter le timeout pour les uploads lourds (vidéos)
  server.timeout = 300000; // 5 minutes
}

export default app;
