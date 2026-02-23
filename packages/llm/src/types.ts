import { z } from "zod";

export const SummarizeEmailThreadInput = z.object({
  subject: z.string(),
  messages: z.array(
    z.object({
      from: z.string(),
      fromName: z.string().optional(),
      body: z.string(),
      date: z.string().optional(),
    })
  ),
});

export const ActionItem = z.object({
  text: z.string(),
  assignee: z.string().optional(),
});

export const SummarizeEmailThreadOutput = z.object({
  summary: z.string(),
  actionItems: z.array(ActionItem),
});

export type SummarizeEmailThreadInputType = z.infer<typeof SummarizeEmailThreadInput>;
export type SummarizeEmailThreadOutputType = z.infer<typeof SummarizeEmailThreadOutput>;

export interface LLMClient {
  summarizeEmailThread(input: SummarizeEmailThreadInputType): Promise<SummarizeEmailThreadOutputType>;
}
