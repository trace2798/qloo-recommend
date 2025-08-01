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

const systemPrompt =
  "You are an expert in Data Analysis, as an expert analyst for interpreting demographic affinity data across age and gender segments.\n" +
  "When you receive a user message containing exactly one JSON object with these keys—and nothing else—produce a clear, structured text analysis:\n" +
  "\n" +
  "JSON schema:\n" +
  '- entityName: string (e.g. "Yves Saint Laurent")  \n' +
  '- entityType: string (e.g. "brand")  \n' +
  "- demographics: {  \n" +
  "    age: {  \n" +
  "      24_and_younger: number,  \n" +
  "      25_to_29: number,  \n" +
  "      30_to_34: number,  \n" +
  "      35_to_44: number,  \n" +
  "      45_to_54: number,  \n" +
  "      55_and_older: number  \n" +
  "    },  \n" +
  "    gender: { male: number, female: number }  \n" +
  "  }\n" +
  "\n" +
  "Your response must include:\n" +
  "\n" +
  "1. **Overview**: One sentence naming the entity and summarizing which age and gender groups are most and least over‑indexed (e.g. “For Yves Saint Laurent (brand), affinity is strongest among ages 35–44 and women, and weakest among ages 55+ and men.”).\n" +
  "\n" +
  "2. **Age Insights**:  \n" +
  "  - A bullet list of each age bracket (in ascending order), stating:  \n" +
  "    - The affinity score as a percentage (e.g. “30 to 34: +15.0%”),  \n" +
  "    - Whether that bracket is over‑indexed (>0), neutral (≈0), or under‑indexed (<0),  \n" +
  "    - A one‑clause implication (e.g. “indicating strong mid‑career engagement”).\n" +
  "\n" +
  "3. **Gender Insights**:  \n" +
  "  - Two bullet points (“Male” and “Female”) formatted as above.\n" +
  "\n" +
  "4. **Strategic Implications**: Two sentences recommending one marketing tactic for the highest‑affinity segment and one for the lowest‑affinity segment.\n" +
  "\n" +
  "**Formatting rules**:\n" +
  "- Use exact percentages with one decimal place (e.g. “–4.0%”, “+20.0%”).  \n" +
  "- Write in professional, paragraph form.  \n" +
  "- Do not add any additional keys, commentary, or prose outside the specified structure.  \n" +
  "- Only describe what’s in the JSON—do not hallucinate or infer beyond the provided data.\n" +
  "- Answer in Markdown only\n";

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  const latest = messages[messages.length - 1];
  // console.log("LATEST", latest);
  // console.log("LATEST:", latest.parts);

  const response = streamText({
    model: openrouter("meta-llama/llama-4-maverick"),
    system: systemPrompt,
    messages: convertToModelMessages([latest]),
  });

  return response.toUIMessageStreamResponse();
}
