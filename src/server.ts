import { app } from "./app";
import { env } from "./config/env";
import { logger } from "./infrastructure/logger/logger";

const isVercel = process.env.VERCEL === "1";

if (!isVercel) {
  app.listen(env.PORT, () => {
    logger.info(`Server running on http://localhost:${env.PORT}`);
    logger.info(`Swagger docs on http://localhost:${env.PORT}/api/docs`);
  });
}

export default app;
