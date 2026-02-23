import type { PrismaClient } from "@threaded-nexus/db";

/**
 * Gmail-like payload shape (stub). Real payload will come from Gmail API.
 */
interface GmailStubPayload {
  threadId?: string;
  subject?: string;
  from?: string;
  fromName?: string;
  fromEmail?: string;
  messages?: Array<{ from?: string; fromName?: string; fromEmail?: string; date?: string }>;
  receivedAt?: string;
}

/**
 * Normalize a GMAIL SourceEvent into Person(s) + Interaction (EMAIL_THREAD).
 * Idempotent: uses rawRef (threadId) to avoid duplicate interactions.
 */
export async function normalizeGmailEvent(prisma: PrismaClient, sourceEventId: string): Promise<void> {
  const event = await prisma.sourceEvent.findUnique({
    where: { id: sourceEventId },
  });

  if (!event || event.source !== "GMAIL") {
    throw new Error(`SourceEvent ${sourceEventId} not found or not GMAIL`);
  }

  const payload = event.payload as GmailStubPayload;
  const rawRef = payload.threadId ?? event.sourceId;
  const subject = payload.subject ?? "(no subject)";
  const occurredAt = payload.receivedAt ? new Date(payload.receivedAt) : event.receivedAt;

  // Idempotency: already have an interaction for this thread?
  const existing = await prisma.interaction.findFirst({
    where: { rawRef, type: "EMAIL_THREAD" },
  });
  if (existing) {
    await prisma.sourceEvent.update({
      where: { id: sourceEventId },
      data: { processedAt: new Date() },
    });
    return;
  }

  const emails = new Set<string>();
  if (payload.fromEmail) emails.add(payload.fromEmail);
  if (payload.from && payload.from.includes("@")) emails.add(payload.from);
  (payload.messages ?? []).forEach((m) => {
    if (m.fromEmail) emails.add(m.fromEmail);
    if (m.from && m.from.includes("@")) emails.add(m.from);
  });
  if (emails.size === 0) {
    emails.add("unknown@unknown");
  }

  const personIds: string[] = [];
  for (const email of emails) {
    let identity = await prisma.identity.findUnique({
      where: { type_value: { type: "EMAIL", value: email } },
      include: { person: true },
    });
    if (!identity) {
      const person = await prisma.person.create({
        data: {
          fullName: payload.fromName ?? email,
          primaryEmail: email,
        },
      });
      await prisma.identity.create({
        data: { personId: person.id, type: "EMAIL", value: email, isPrimary: true },
      });
      personIds.push(person.id);
    } else {
      personIds.push(identity.personId);
    }
  }

  await prisma.interaction.create({
    data: {
      type: "EMAIL_THREAD",
      occurredAt,
      subject,
      rawRef,
      sourceEventId: event.id,
      participants: {
        create: [...new Set(personIds)].map((personId) => ({ personId })),
      },
    },
  });

  await prisma.sourceEvent.update({
    where: { id: sourceEventId },
    data: { processedAt: new Date() },
  });
}
