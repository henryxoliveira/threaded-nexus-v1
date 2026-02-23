import { Queue } from "bullmq";
import IORedis from "ioredis";
import { NORMALIZE_SOURCE_EVENT_QUEUE } from "@threaded-nexus/core";

export { NORMALIZE_SOURCE_EVENT_QUEUE };

function getRedisConnection(): IORedis {
  const url = process.env.REDIS_URL ?? "redis://localhost:6379";
  return new IORedis(url, { maxRetriesPerRequest: null });
}

let queue: Queue | null = null;

export function getNormalizeQueue(): Queue {
  if (!queue) {
    const connection = getRedisConnection();
    queue = new Queue(NORMALIZE_SOURCE_EVENT_QUEUE, {
      connection,
      defaultJobOptions: { removeOnComplete: { count: 1000 }, attempts: 3 },
    });
  }
  return queue;
}

export async function enqueueNormalizeSourceEvent(sourceEventId: string): Promise<void> {
  const q = getNormalizeQueue();
  await q.add("normalize", { sourceEventId }, { jobId: sourceEventId });
}
