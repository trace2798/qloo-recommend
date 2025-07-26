import { entityIdLookup, getRecommendationsByEntityId } from "@/lib/qlooTools";
import { createTogetherAI } from "@ai-sdk/togetherai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import {
  convertToModelMessages,
  extractReasoningMiddleware,
  stepCountIs,
  streamText,
  UIMessage,
  wrapLanguageModel,
} from "ai";

export const maxDuration = 60;

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

const togetherai = createTogetherAI({
  apiKey: process.env.TOGETHER_AI_API!,
});

// const systemPrompt =
//   "You are a movie recommendation assistant. You have two tools:\n" +
//   "\n" +
//   "1. entityLookup\n" +
//   '   • Input schema: { "title": "<string>" }\n' +
//   '   • Returns: { "entityId": "<string>", "name": "<string>" }\n' +
//   "\n" +
//   "2. getRecommendations\n" +
//   '   • Input schema: { "entityId": "<string>", "take": <number> }\n' +
//   "   • Returns: JSON array of SlimMovie objects\n" +
//   "\n" +
//   "Whenever you need to call a tool, respond with EXACTLY one JSON object and NO extra text.  \n" +
//   "Format each call like this:\n" +
//   "{\n" +
//   '  "tool_calls": [\n' +
//   "    {\n" +
//   '      "name": "<toolName>",\n' +
//   '      "type": "function",\n' +
//   '      "arguments": { /* your args here */ }\n' +
//   "    }\n" +
//   "  ]\n" +
//   "}\n" +
//   "\n" +
//   "Step 1: When the user says a movie title, call **entityLookup**:\n" +
//   "{\n" +
//   '  "tool_calls": [\n' +
//   '    { "name": "entityLookup", "type": "function", "arguments": { "title": "<Movie Title>" } }\n' +
//   "  ]\n" +
//   "}\n" +
//   "\n" +
//   'Step 2: After you get back { "entityId": "..." }, call **getRecommendations**:\n' +
//   "{\n" +
//   '  "tool_calls": [\n' +
//   '    { "name": "getRecommendations", "type": "function", "arguments": { "entityId": "<entityId>", "take": <count> } }\n' +
//   "  ]\n" +
//   "}\n" +
//   "\n" +
//   "Step 3: Once you receive the recommendations array, output a friendly, conversational summary of each film (title, year, description, rating, etc.).\n" +
//   "\n" +
//   "No backticks, no commentary, no extra JSON during steps 1 & 2—only the prescribed JSON objects.  \n" +
//   "After both tools have run, switch to plain text for your user reply.\n";
const systemPrompt = `You are a movie recommender. Based on user's input you will recommend movies in a friendly tone. To provide the answer, you will need to use the available tools: ${entityIdLookup} and ${getRecommendationsByEntityId}. While responding the users provide a detail answer by providing ratings and other information about the movie.`;
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
    model,
    tools: { entityIdLookup, getRecommendationsByEntityId },
    system: systemPrompt,
    messages: convertToModelMessages([latest]),
    toolChoice: "auto",
    // activeTools: ["entityIdLookup", "getRecommendationsByEntityId"],
    stopWhen: stepCountIs(3),
    //   prepareStep: ({ stepNumber }) => {
    //     if (stepNumber === 1) {
    //       // return {
    //       //   model: openrouter("meta-llama/llama-3.3-70b-instruct"),
    //       //   toolChoice: { type: "tool", toolName: "entityLookup" },
    //       //   experimental_activeTools: ["entityLookup"],
    //       // };
    //       return { activeTools: ["entityIdLookup"] };
    //     }
    //     if (stepNumber === 2) {
    //       // return {
    //       //   // model: togetherai("meta-llama/Llama-3.3-70B-Instruct-Turbo"),
    //       //   model: openrouter("nvidia/llama-3.1-nemotron-70b-instruct"),
    //       //   toolChoice: { type: "tool", toolName: "getRecommendations" },
    //       //   experimental_activeTools: ["getRecommendations"],
    //       // };
    //       return { activeTools: ["getRecommendationsByEntityId"] };
    //     }
    //     return { activeTools: [] };
    //     // return {
    //     //   model: openrouter("meta-llama/llama-4-maverick"),
    //     //   experimental_activeTools: [],
    //     // };
    //   },
    // });
    prepareStep: async ({ stepNumber }) => {
      if (stepNumber === 0) {
        return {
          model: openrouter("meta-llama/llama-4-scout"),
          toolChoice: { type: "tool", toolName: "entityIdLookup" },
        };
      }
      if (stepNumber === 1) {
        return {
          model: openrouter("meta-llama/llama-4-scout"),
          toolChoice: {
            type: "tool",
            toolName: "getRecommendationsByEntityId",
          },
        };
      }
      return {};
    },
  });
  return response.toUIMessageStreamResponse();
}
