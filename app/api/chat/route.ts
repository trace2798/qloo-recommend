import {
  convertToModelMessages,
  streamText,
  UIMessage,
  stepCountIs,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";
import { createTogetherAI } from "@ai-sdk/togetherai";
import { entityLookup, getRecommendations } from "@/lib/qlooTools";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

export const maxDuration = 60;

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

const togetherai = createTogetherAI({
  apiKey: process.env.TOGETHER_AI_API!,
});

// const systemPrompt = `
// You are a movie recommendation assistant. Follow these steps when users ask for movie recommendations:

// 1. TITLE IDENTIFICATION
// - Extract the exact movie title from user requests
// - If unclear, ask: "Which movie would you like recommendations for?"

// 2. ENTITY LOOKUP
// - Call \`entityLookup\` with the exact title
// - Handle possible outcomes:
//   • If found: Get {entityId, name}
//   • If null: Respond: "Couldn't find '[title]' in our database. Please check spelling or try another title"

// 3. GET RECOMMENDATIONS
// - For successful lookups, call \`getRecommendations\` with:
//   {
//     entityId: from_step_2,
//     take: 5 (default)
//   }

// 4. PRESENT RESULTS
// Format successful responses as:
// """
// Based on "[SOURCE MOVIE]", you might enjoy:

// 1. [Movie Name] ([Release Year])
//    - Rating: ⭐ [IMDB Rating] | 🍅 [Tomatometer]%
//    - Runtime: [duration] mins
//    - Description: [First 50 words]...

// 2. [Next Movie]...
// """

// 5. SPECIAL CASES
// - If no recommendations found: "No similar movies found for '[title]'"
// - Always mention source movie in recommendations
// - Include ratings when available (IMDB/Tomatometer)
// `;

const systemPrompt = `You are a movie recommendation assistant. Provide a friendly response back to the user for movie recommendation`;

const model = wrapLanguageModel({
  model: openrouter("meta-llama/llama-4-maverick"),
  middleware: extractReasoningMiddleware({ tagName: "reasoning" }),
});

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  console.log("[agent] incoming messages:", messages);
  const latest = messages[messages.length - 1];
  console.log("LATEST", latest);
  const response = streamText({
    // model: togetherai("meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8"),
    // model: togetherai("meta-llama/Llama-4-Scout-17B-16E-Instruct"),
    // model: togetherai("meta-llama/Llama-3.3-70B-Instruct-Turbo"),
    // model: openrouter("meta-llama/llama-4-maverick"),
    model,
    // model: openrouter("meta-llama/llama-4-scout"),
    tools: { entityLookup, getRecommendations },
    system: systemPrompt,
    messages: convertToModelMessages([latest]),
    toolChoice: "required",
    activeTools: ["entityLookup", "getRecommendations"],
    stopWhen: stepCountIs(3),
    prepareStep: ({ stepNumber }) => {
      if (stepNumber === 1) {
        return { activeTools: ["entityLookup"] };
      }
      if (stepNumber === 2) {
        return { activeTools: ["getRecommendations"] };
      }
      return { activeTools: [] };
    },
  });

  return response.toUIMessageStreamResponse();
}
