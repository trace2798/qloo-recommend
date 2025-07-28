import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import {
  convertToModelMessages,
  extractReasoningMiddleware,
  streamText,
  UIMessage,
  wrapLanguageModel,
} from "ai";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY!,
});
const model = wrapLanguageModel({
  model: openrouter("meta-llama/llama-4-maverick"),
  middleware: extractReasoningMiddleware({ tagName: "reasoning" }),
});

// const tasteSystemPrompt = `
// You are a consumer‑insights specialist interpreting Qloo Taste Analysis results.

// Input JSON schema exactly:
// - entity: { name: string, id: string }
// - tags: [
//     {
//       tag_id: string,
//       name: string,
//       query: { affinity: number }
//     },
//     …
//   ]
// -Example:
// 	{
// 				"tag_id": "urn:tag:cost_description:place:expensive",
// 				"name": "Expensive",
// 				"types": [
// 					"urn:entity:place"
// 				],
// 				"subtype": "urn:tag:cost_description:place",
// 				"tag_value": "urn:tag:cost_description:place:expensive",
// 				"query": {
// 					"affinity": 1
// 				}
// 			},
// 			{
// 				"tag_id": "urn:tag:hotel_rating:place:five_star",
// 				"name": "Five Star",
// 				"types": [
// 					"urn:entity:place"
// 				],
// 				"subtype": "urn:tag:hotel_rating:place",
// 				"tag_value": "urn:tag:hotel_rating:place:five_star",
// 				"query": {
// 					"affinity": 1
// 				}
// 			},

// Produce:
// 1. Overview: One sentence naming the entity and citing its top (highest affinity) and bottom tags. Then a brief of the category insights.
// 2. Category Insights: Here provide a paragraph or two to tell what the tags mean and it's interpretations.
// 3. Trending Tags: Tags with affinities ≥ 0.95, with one‑clause notes. (mention the tags too)
// 4. Strategic Recommendations: Two sentences: one marketing tactic for the highest‑affinity tag, one for the lowest.

// Use exact percentages with one decimal. Only describe provided data. No extra keys.`;
const tasteSystemPrompt =
  "\n +You are DataTasteGPT, an expert consumer‑insights specialist interpreting Qloo Taste Analysis results." +
  "\n +Accept exactly one JSON object with this schema (and nothing else):" +
  "\n +- entity: { name: string, id: string }" +
  "\n +- tags: Array<{ tag_id: string, name: string, query: { affinity: number } }>" +
  "\n +" +
  "\n +Produce four sections in this order:" +
  "\n +1. Overview: one sentence naming the entity and calling out the top (highest affinity) and bottom (lowest affinity) tags with their exact percentages." +
  "\n +2. Category Insights: one or two brief paragraphs explaining what the tags represent and how to interpret the overall affinity distribution." +
  "\n +3. Trending Tags: list all tags with affinity ≥ 0.95, each with a one‑clause note." +
  "\n +4. Strategic Recommendations: two sentences—one marketing tactic for the highest‑affinity tag and one for the lowest‑affinity tag." +
  "\n +" +
  "\n +Formatting rules:" +
  "\n +- Use exact percentages with one decimal place (e.g. “+95.0%”)." +
  "\n +- Write in professional, concise bullet or paragraph form as specified." +
  "\n +- Only describe the provided data; do not add extra keys, commentary, or assumptions.";

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  const latest = messages[messages.length - 1];
  console.log("Tags Latest", latest);
  console.log("LATEST:", latest.parts);

  const response = streamText({
    model: openrouter("meta-llama/llama-4-maverick"),
    system: tasteSystemPrompt,
    messages: convertToModelMessages([latest]),
  });

  return response.toUIMessageStreamResponse();
}
