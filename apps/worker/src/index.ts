import { Worker } from "bullmq";
import IORedis from "ioredis";
import { loadConfig } from "@threaded-nexus/config";
import { createPrismaClient } from "@threaded-nexus/db";
import { ToolGateway, stubHandlers } from "@threaded-nexus/tool-gateway";
import { NORMALIZE_SOURCE_EVENT_QUEUE } from "@threaded-nexus/core";
import { normalizeGmailEvent } from "./normalize";

function getRedisConnection(): IORedis {
  const url = process.env.REDIS_URL ?? "redis://localhost:6379";
  return new IORedis(url, { maxRetriesPerRequest: null });
}

async function main() {
  loadConfig();
  const prisma = createPrismaClient();
  const connection = getRedisConnection();
  const toolGateway = new ToolGateway({ prisma, defaultActor: "SYSTEM" });

  const worker = new Worker(
    NORMALIZE_SOURCE_EVENT_QUEUE,
    async (job) => {
      const { sourceEventId } = job.data as { sourceEventId: string };
      try {
        const event = await prisma.sourceEvent.findUnique({
          where: { id: sourceEventId },
        });
        if (!event) {
          throw new Error(`SourceEvent ${sourceEventId} not found`);
        }
        if (event.source === "GMAIL") {
          await normalizeGmailEvent(prisma, sourceEventId);
        } else {
          await prisma.sourceEvent.update({
            where: { id: sourceEventId },
            data: { processedAt: new Date() },
          });
        }
      } catch (err) {
        await prisma.sourceEvent.update({
          where: { id: sourceEventId },
          data: { processingError: (err as Error).message },
        });
        throw err;
      }
    },
    { connection, concurrency: 5 }
  );

  worker.on("failed", (job, err) => {
    console.error("Job failed", job?.id, err);
  });

  setInterval(async () => {
    const approved = await toolGateway.getApprovedActions();
    for (const { id, toolName, request } of approved) {
      const handler = stubHandlers[toolName];
      if (handler) {
        await handler(request);
        await toolGateway.markExecuted(id);
      }
    }
  }, 10_000);

  console.log("Worker running: normalize-source-event");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
