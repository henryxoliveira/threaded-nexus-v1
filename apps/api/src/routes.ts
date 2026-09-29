import type { FastifyInstance } from "fastify";
import type { PrismaClient } from "@threaded-nexus/db";
import type { ToolGateway } from "@threaded-nexus/tool-gateway";
import { IngestSourceEventSchema } from "@threaded-nexus/core";
import { enqueueNormalizeSourceEvent } from "./queue";

export interface ApiDeps {
  prisma: PrismaClient;
  toolGateway: ToolGateway;
}

export function registerRoutes(app: FastifyInstance, deps: ApiDeps): void {
  const { prisma, toolGateway } = deps;

  app.get("/health", async (_req, reply) => {
    void reply.header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    void reply.header("Pragma", "no-cache");
    void reply.header("Expires", "0");
    void reply.header("Surrogate-Control", "no-store");
    return { ok: true };
  });

  app.get("/debug/stats", async () => {
    const [sourceEvents, interactions, tasks, pendingApprovals] = await Promise.all([
      prisma.sourceEvent.count(),
      prisma.interaction.count(),
      prisma.task.count(),
      prisma.toolApproval.count({ where: { status: "PENDING" } }),
    ]);
    return { sourceEvents, interactions, tasks, pendingApprovals };
  });

  app.post("/ingest/source-event", async (req, reply) => {
    const parsed = IngestSourceEventSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid body", details: parsed.error.flatten() });
    }
    const { source, sourceId, payload } = parsed.data;

    const existing = await prisma.sourceEvent.findUnique({ where: { sourceId } });
    if (existing) {
      return reply.status(200).send({ id: existing.id, existing: true });
    }

    const event = await prisma.sourceEvent.create({
      data: { source, sourceId, payload },
    });

    await enqueueNormalizeSourceEvent(event.id);

    return reply.status(201).send({ id: event.id });
  });

  app.get("/approvals", async () => {
    const list = await prisma.toolApproval.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
    });
    return { approvals: list };
  });

  app.post("/approvals/:id/approve", async (req, reply) => {
    const { id } = req.params as { id: string };
    try {
      await toolGateway.approveToolAction(id, "APPROVED", { decidedBy: "USER" });
      return reply.status(200).send({ ok: true });
    } catch (e) {
      return reply.status(400).send({ error: (e as Error).message });
    }
  });

  app.post("/approvals/:id/reject", async (req, reply) => {
    const { id } = req.params as { id: string };
    try {
      await toolGateway.approveToolAction(id, "REJECTED", { decidedBy: "USER" });
      return reply.status(200).send({ ok: true });
    } catch (e) {
      return reply.status(400).send({ error: (e as Error).message });
    }
  });

  app.post("/tools/request", async (req, reply) => {
    const body = req.body as { toolName: string; payload: unknown };
    const { toolName, payload } = body;
    if (!toolName || payload === undefined) {
      return reply.status(400).send({ error: "toolName and payload required" });
    }
    try {
      const { approvalId } = await toolGateway.requestToolAction(toolName, payload);
      return reply.status(201).send({ approvalId });
    } catch (e) {
      return reply.status(400).send({ error: (e as Error).message });
    }
  });
}
