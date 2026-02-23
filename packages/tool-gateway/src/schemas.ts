import { z } from "zod";

/** Tool request payloads — extend per tool. */
export const SendEmailRequestSchema = z.object({
  to: z.string().email(),
  subject: z.string(),
  body: z.string(),
});

export const CreateCalendarEventRequestSchema = z.object({
  title: z.string(),
  start: z.string(), // ISO datetime
  end: z.string(),
  attendees: z.array(z.string().email()).optional(),
});

export const toolPayloadSchemas: Record<string, z.ZodType> = {
  send_email: SendEmailRequestSchema,
  create_calendar_event: CreateCalendarEventRequestSchema,
};

export type SendEmailRequest = z.infer<typeof SendEmailRequestSchema>;
export type CreateCalendarEventRequest = z.infer<typeof CreateCalendarEventRequestSchema>;
