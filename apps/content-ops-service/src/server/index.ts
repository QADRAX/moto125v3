import express from "express";
import cors from "cors";
import { basicAuth } from "./auth";
import { rateLimit } from "./rateLimit";
import { resolveUiDistPath } from "./resolveUiPath";
import type { ServerOptions } from "./types";

import { mountHealthRoute } from "./routes/health";
import { mountLogsRoute } from "./routes/logs";
import { mountJobsRoutes } from "./routes/jobs";

export function createServer(opts: ServerOptions) {
  const app = express();

  if (opts.rate.trustProxy) app.set("trust proxy", true);
  app.use(
    rateLimit({
      capacity: opts.rate.capacity,
      windowSeconds: opts.rate.windowSeconds,
      maxTrackedKeys: opts.rate.maxTrackedKeys,
      pruneIntervalSeconds: opts.rate.pruneIntervalSeconds,
    })
  );
  app.use(cors());
  app.use(express.json());

  // Public
  mountHealthRoute(app);

  // Protected
  app.use(
    basicAuth({
      user: opts.auth.user,
      password: opts.auth.password,
      maxFails: opts.auth.maxFails,
      lockoutSeconds: opts.auth.lockoutSeconds,
      windowSeconds: opts.auth.windowSeconds,
      maxTrackedKeys: opts.auth.maxTrackedKeys,
      pruneIntervalSeconds: opts.auth.pruneIntervalSeconds,
    })
  );

  // Feature routes
  mountJobsRoutes(app, opts);
  mountLogsRoute(app, opts.bus);

  // Static UI
  const uiRoot = resolveUiDistPath();
  opts.log.info(`Serving UI from package: ${uiRoot}`);
  app.use("/", express.static(uiRoot));

  const server = app.listen(opts.port, () => {
    opts.log.info(`HTTP server listening on port ${opts.port}`);
  });

  return server;
}
