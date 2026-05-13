import { app } from "./app";
import { env } from "./config/env";
import { logger } from "./infrastructure/logger/logger";

app.listen(env.PORT, () => {
  logger.info(`Server running on http://localhost:${env.PORT}`);
  logger.info(`Swagger docs on http://localhost:${env.PORT}/api/docs`);
});
