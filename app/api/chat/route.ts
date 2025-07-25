// import { togetherai } from "@ai-sdk/togetherai";
import { convertToModelMessages, streamText, UIMessage } from "ai";
import { createTogetherAI } from '@ai-sdk/togetherai';

export const maxDuration = 30;


const togetherai = createTogetherAI({
  apiKey: process.env.TOGETHER_AI_API!,
});

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: togetherai("meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8"),
    messages: convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
