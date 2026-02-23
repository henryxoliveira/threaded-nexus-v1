import type { PrismaClient } from "@threaded-nexus/db";
import { toolPayloadSchemas } from "./schemas";

const APPROVAL_TARGET = "ToolApproval";

export interface ToolGatewayOptions {
  prisma: PrismaClient;
  /** Actor for audit log when request is created (e.g. "AGENT") */
  defaultActor?: string;
}

/**
 * Permissioned tool gateway: all tool actions go through request → approval → execute.
 * requestToolAction creates PENDING approval + audit log.
 * approveToolAction marks APPROVED (or REJECTED).
 * executeApprovedActions is called by worker to run approved handlers.
 */
export class ToolGateway {
  constructor(private readonly options: ToolGatewayOptions) {}

  private get prisma() {
    return this.options.prisma;
  }

  private get actor() {
    return this.options.defaultActor ?? "SYSTEM";
  }

  /**
   * Request a tool action. Creates ToolApproval(PENDING) and AuditLog.
   * Payload is validated against the tool's Zod schema.
   */
  async requestToolAction(
    toolName: string,
    payload: unknown,
    opts?: { actor?: string }
  ): Promise<{ approvalId: string }> {
    const schema = toolPayloadSchemas[toolName];
    if (!schema) {
      throw new Error(`Unknown tool: ${toolName}`);
    }
    const parsed = schema.parse(payload) as object;

    const approval = await this.prisma.toolApproval.create({
      data: {
        toolName,
        request: parsed as object,
        status: "PENDING",
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actor: opts?.actor ?? this.actor,
        action: "tool_request",
        targetType: APPROVAL_TARGET,
        targetId: approval.id,
        metadata: { toolName },
      },
    });

    return { approvalId: approval.id };
  }

  /**
   * Approve or reject a pending tool action. Records decision in AuditLog.
   */
  async approveToolAction(
    approvalId: string,
    status: "APPROVED" | "REJECTED",
    opts?: { decidedBy?: string }
  ): Promise<void> {
    const approval = await this.prisma.toolApproval.findUnique({
      where: { id: approvalId },
    });
    if (!approval) throw new Error(`Approval not found: ${approvalId}`);
    if (approval.status !== "PENDING") throw new Error(`Approval already decided: ${approvalId}`);

    await this.prisma.toolApproval.update({
      where: { id: approvalId },
      data: { status, decidedAt: new Date(), decidedBy: opts?.decidedBy ?? null },
    });

    await this.prisma.auditLog.create({
      data: {
        actor: "USER",
        action: `tool_${status.toLowerCase()}`,
        targetType: APPROVAL_TARGET,
        targetId: approvalId,
        metadata: { toolName: approval.toolName, decidedBy: opts?.decidedBy },
      },
    });
  }

  /**
   * Fetch all APPROVED tool approvals not yet executed (for worker to execute).
   */
  async getApprovedActions(): Promise<
    Array<{ id: string; toolName: string; request: object }>
  > {
    const list = await this.prisma.toolApproval.findMany({
      where: { status: "APPROVED", executedAt: null },
      orderBy: { createdAt: "asc" },
    });
    return list.map(
      (a): { id: string; toolName: string; request: object } => ({
        id: a.id,
        toolName: a.toolName,
        request: a.request as object,
      })
    );
  }

  /**
   * Mark an approval as executed (sets executedAt + audit log).
   */
  async markExecuted(approvalId: string): Promise<void> {
    await this.prisma.toolApproval.update({
      where: { id: approvalId },
      data: { executedAt: new Date() },
    });
    await this.prisma.auditLog.create({
      data: {
        actor: "SYSTEM",
        action: "tool_executed",
        targetType: APPROVAL_TARGET,
        targetId: approvalId,
        metadata: {},
      },
    });
  }
}
