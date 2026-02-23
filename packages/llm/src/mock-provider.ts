import type { LLMClient } from "./types";
import type { SummarizeEmailThreadInputType, SummarizeEmailThreadOutputType } from "./types";

/**
 * Mock LLM provider for local dev — no network, deterministic stub responses.
 * TODO: Add OpenAI-compatible provider when API key is configured.
 */
export class MockLLMProvider implements LLMClient {
  async summarizeEmailThread(input: SummarizeEmailThreadInputType): Promise<SummarizeEmailThreadOutputType> {
    const msgCount = input.messages.length;
    return {
      summary: `[Mock] Thread about "${input.subject}" with ${msgCount} message(s).`,
      actionItems: [
        { text: "[Mock] Follow up on this thread", assignee: undefined },
      ],
    };
  }
}
