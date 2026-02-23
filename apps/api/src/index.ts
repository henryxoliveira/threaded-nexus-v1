import Fastify from "fastify";
import { loadConfig } from "@threaded-nexus/config";
import { createPrismaClient } from "@threaded-nexus/db";
import { ToolGateway } from "@threaded-nexus/tool-gateway";
import { registerRoutes } from "./routes";

async function main() {
  const config = loadConfig();
  const prisma = createPrismaClient();

  const app = Fastify({ logger: true });

  const toolGateway = new ToolGateway({ prisma, defaultActor: "API" });

  registerRoutes(app, { prisma, toolGateway });

  try {
    await app.listen({ port: config.PORT, host: "0.0.0.0" });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
