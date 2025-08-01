import { saveMessage } from "@/app/actions";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import {
  convertToModelMessages,
  extractReasoningMiddleware,
  generateText,
  streamText,
  UIDataTypes,
  UIMessage,
  UIMessagePart,
  UITools,
  wrapLanguageModel,
} from "ai";
import { NextResponse } from "next/server";

const ENTITY_TYPES = {
  destination: "urn:entity:destination",
  place: "urn:entity:place",
} as const;

type EntityType = keyof typeof ENTITY_TYPES;

export const maxDuration = 60;

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY!,
});
const model = wrapLanguageModel({
  model: openrouter("meta-llama/llama-4-maverick"),
  // model: openrouter("z-ai/glm-4.5"),
  // model: openrouter("deepseek/deepseek-r1-distill-llama-70b"),
  middleware: extractReasoningMiddleware({ tagName: "reasoning" }),
});

const systemPromptUserLooking = `
You are part of an advanced recommendation system.

Your task is to classify the user's query in two ways:
1. **userLook** — what the user is looking for: either "place" or "destination".
   - Use "place" for restaurants, museums, attractions, venues, etc.
   - Use "destination" for cities, countries, or general regions.

2. **queryTerm** — the most relevant name or location being referred to (city name, country name, restaurant, etc.).
   - If the user mentioned both a place and a destination, prefer the destination as queryTerm (e.g., city/country).
   - If nothing concrete is mentioned, return an empty string "" as queryTerm.

**Output format (must be valid JSON):**

\`\`\`json
{
  "userLook": "place" | "destination",
  "queryTerm": "string"
}
\`\`\`

**Examples:**

Input: "Suggest restaurants in London"  
{
  "userLook": "place",
  "queryTerm": "London"
}

Input: "somewhere like Cancun"  
{
  "userLook": "destination",
  "queryTerm": "Cancun"
}

Input: "A romantic cafe like Le Petit Nice in Marseille"  
{
  "userLook": "place",
  "queryTerm": "Marseille"
}

If nothing is identifiable, return:
{
  "userLook": "",
  "queryTerm": ""
}


Only return the JSON object—no extra text or markdown.
`.trim();

const keywordExtractorSystemPrompt =
  "You are a keyword extractor. Your job is to extract **only** the main keywords and short phrases that capture the core concepts of the user’s query—nothing else.  \n" +
  "**Output format:** a JSON array of strings. \n" +
  "Each string must be a single keyword or a concise noun-phrase (e.g. “comedy,” “weekend watch,” “low violence,” “teen-friendly”).  \n" +
  "Do **not** include any extra commentary, labels, numbering, or punctuation beyond valid JSON. \n" +
  "Use double-quoted strings, comma-separated, inside square brackets. \n" +
  "**Examples**  :\n" +
  "Input: “Some movie that a teenager will enjoy, not too much violence”  \n" +
  "```json\n" +
  "[\n" +
  '{"weekend watch", "comedy" }\n' +
  "]\n" +
  "```\n" +
  "Suggest books about time travel and alternate history\n" +
  "```json\n" +
  "[\n" +
  '"time travel", "alternate history", "history\n' +
  `\n` +
  "]\n" +
  "```\n";
type Intent = { title: string; type: EntityType };
interface TextPart {
  type: "text";
  text: string;
}

function isTextPart(p: UIMessagePart<UIDataTypes, UITools>): p is TextPart {
  return p.type === "text";
}

async function searchTags(query: string, take = 3): Promise<string[]> {
  const url = new URL(`${process.env.QLOO_BASE_URL}/v2/tags`);
  url.searchParams.set("feature.typo_tolerance", "true");
  url.searchParams.set("filter.query", query);
  console.log("SEARCH TAGS");
  const res = await fetch(url.toString(), {
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": process.env.QLOO_API_KEY!,
    },
  });
  // https://hackathon.api.qloo.com/v2/tags?feature.typo_tolerance=true&filter.results.tags=urn%3Atag%3Akeyword%3Amedia%3Aextracurricular_activity
  if (!res.ok) return [];
  const { results } = await res.json();
  // console.log("SEARCH TAG RESULTS", results);
  return results.tags.map((t: any) => t.id);
}

export async function POST(req: Request) {
  const {
    id,
    messages,
    userId,
  }: {
    id: string;
    messages: UIMessage[];
    userId: string;
  } = await req.json();
  console.log("MESSAGE", messages);
  console.log("USER ID FROM FE", userId);
  const latest = messages[messages.length - 1];
  console.log("LATET", latest);
  const userQueryText = latest.parts.find(isTextPart)?.text ?? "";
  const dbParts = latest.parts
    .filter(isTextPart)
    .map((p) => ({ content: p.text }));
  // await saveMessage(dbParts, latest.role, userId);

  const { text: userLooking } = await generateText({
    model: openrouter("meta-llama/llama-3.3-70b-instruct"),
    system: systemPromptUserLooking,
    messages: convertToModelMessages([latest]),
    temperature: 0,
  });
  console.log("user looking:", userLooking);
  const userLook: string = JSON.parse(userLooking);

  const { text: extractedKeywords } = await generateText({
    model: openrouter("meta-llama/llama-3.3-70b-instruct"),
    system: keywordExtractorSystemPrompt,
    messages: convertToModelMessages([latest]),
    temperature: 0,
  });
  console.log("AI EXTRACTED KEYOWRD:", extractedKeywords);
  const keywords: string[] = JSON.parse(extractedKeywords);
  const tagIdLists = await Promise.all(keywords.map((kw) => searchTags(kw, 3)));
  console.log("TAG ID LIST", tagIdLists);
  const tagIds = Array.from(new Set(tagIdLists.flat()));
  const filterPrompt =
    "You are a smart tag-filter." +
    "Based on user's query the following tags were grabbed. Now you need to filter those tags which are actually necessary for the query" +
    "Your task is to select **only** the tag IDs that precisely match the user’s request. " +
    "**OUTPUT FORMAT (critical):**" +
    "- Respond with **exactly** a JSON array literal containing the selected tag IDs.";
  "- The output must begin with `[` and end with `]`." +
    "- Use double-quoted strings, comma-separated.  " +
    "- Do **not** include any prose, explanations, markdown, or extra fields—only the JSON array." +
    "**Example output:**  " +
    "```json" +
    "[" +
    "urn:tag:genre:place:restaurant:italian" +
    "urn:tag:offerings:place:vegan" +
    "]" +
    "```" +
    "You should not return anything other the comma separated array" +
    "Add max 2 tag ids" +
    "Return a JSON array containing **only** the tag IDs that truly match the user’s request (nothing else).".trim();

  const { text: filteredJson } = await generateText({
    model: openrouter("meta-llama/llama-3.3-70b-instruct"),
    system: filterPrompt,
    messages: [
      {
        role: "user",
        content: `Here is the list of tags: ${tagIds} and here is the user's query: ${userQueryText}`,
      },
    ],
    temperature: 0,
  });

  console.log("AI FIltered tags:", filteredJson);

  let finalTagIds: string[];
  try {
    const parsed = JSON.parse(filteredJson) as string[];
    if (Array.isArray(parsed) && parsed.length > 0) {
      finalTagIds = parsed;
    } else {
      console.warn("LLM returned empty or non-array, falling back");
      finalTagIds = tagIds;
    }
  } catch (err) {
    console.warn("Failed to parse filteredJson, falling back:", err);
    finalTagIds = tagIds;
  }

  const parsedUserLooking = JSON.parse(userLooking) as {
    userLook: EntityType;
    queryTerm: string;
  };
  const individualQueryResults = await Promise.all(
    finalTagIds.map((tag) =>
      fetchRecommendationsByQuery({
        entityType: parsedUserLooking.userLook,
        tag,
        locationQuery: parsedUserLooking.queryTerm,
        take: 5,
      })
    )
  );
  const allResults = individualQueryResults.flat();
  const uniqueResultsMap = new Map();
  for (const entity of allResults) {
    if (!uniqueResultsMap.has(entity.entity_id)) {
      uniqueResultsMap.set(entity.entity_id, entity);
    }
  }
  const deduplicatedResults = Array.from(uniqueResultsMap.values());

  const responseSystemPrompt =
    "You are an AI Recommender Assistant.\n" +
    "You are to answer to the user based on the Data we got from Qloo.\n" +
    "Now craft a friendly,detailed,  concise natural-language reply that explains and lists them, including available ratings, details, platforms etc etc.";

  const response = streamText({
    model: openrouter("meta-llama/llama-4-maverick"),
    system: responseSystemPrompt,
    messages: [
      {
        role: "user",
        content: `Here is the user's query: ${userQueryText} and here are the recommendation: ${JSON.stringify(
          deduplicatedResults,
          null,
          2
        )}`,
      },
    ],
  });

  return response.toUIMessageStreamResponse();
}

const searchQloo = async ({
  title,
  entityType,
}: {
  title: string;
  entityType: EntityType;
}) => {
  const urn = ENTITY_TYPES[entityType];
  const url =
    `${process.env.QLOO_BASE_URL}/search` +
    `?query=${encodeURIComponent(title)}` +
    `&types=${encodeURIComponent(urn)}` +
    `&take=${2}`;

  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": process.env.QLOO_API_KEY!,
    },
  });
  const json = await res.json();
  console.log("Search JSON", json);
  const first = Array.isArray(json.results) && json.results[0];
  if (!first) return null;
  const { entity_id, name, location } = first as {
    entity_id: string;
    name: string;
    location: { lat: number; lon: number };
  };

  return {
    entityId: String(entity_id),
    name,
    location,
  };
};

async function fetchRecommendationsByQuery({
  entityType,
  tag,
  locationQuery,
  take = 5,
}: {
  entityType: EntityType;
  tag: string;
  locationQuery: string;
  take?: number;
}): Promise<any[]> {
  const urn = ENTITY_TYPES[entityType];
  const url = new URL(`${process.env.QLOO_BASE_URL}/v2/insights`);

  url.searchParams.set("filter.type", urn);

  if (tag) {
    url.searchParams.set("filter.tags", tag);
  }

  if (locationQuery) {
    url.searchParams.set("signal.location.query", locationQuery);
  }

  url.searchParams.set("take", String(take));

  console.log("Endpoint URL:", url.toString());

  const res = await fetch(url.toString(), {
    headers: {
      "X-Api-Key": process.env.QLOO_API_KEY!,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) return [];
  const data = await res.json();
  console.log("FETCH Rec BY TAG and LOCATION", data.results.entities);
  return data.results.entities;
}
