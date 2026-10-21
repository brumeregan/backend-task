import { createApp, startHttpApp } from "./app";
import { getConfig } from "./config";
import { initModels } from "./models";
import { createResources, startResources } from "./resources";

const main = async () => {
  const config = getConfig();
  const resources = await createResources(config);
  initModels(resources.database);
  const app = createApp(config.http, resources);

  try {
    const releaseResources = await startResources(resources);
    const onExit = await startHttpApp(app, config.http, resources);
    onExit(releaseResources);
  } catch (error) {
    resources.logger.error(`Failed to start application: ${error}`);

    throw error;
  }
};

main().catch((error: unknown) => {
  console.error({ err: error }, "Failed to start");
  process.exit(1);
});
