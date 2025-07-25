import { togetherai } from "@ai-sdk/togetherai";
import { streamText, UIMessage, convertToModelMessages } from "ai";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  const result = streamText({
    model: togetherai("meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8"),
    messages: convertToModelMessages(messages),
  });
  return result.toUIMessageStreamResponse();
}
