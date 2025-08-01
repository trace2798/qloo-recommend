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

const systemPrompt =
  "You are an intent parser. Your job is to extract **only** the seed entities and their types, **without** generating any recommendations.  \n" +
  "If the user's query is abstract without an title then respond with an empty array: []\n" +
  "Output **must** be a JSON array of objects with keys **title** and **type** (e.g. destination or person). \n" +
  "When the user sends a query, you **must** emit exactly one JSON array of objects (no prose, no markdown, no extra fields) with these two properties:\n\n" +
  '• "title" (string) – the name of the thing the user is asking about\n' +
  '• "type" (string) – one of: destination or place\n\n' +
  "For city, country etc etc destination should be used and for restaurant, museums etc place should be used. ";
"Make sure your output is valid JSON (double‑quoted keys and strings) and contains **only** that array.\n\n" +
  "Example:\n" +
  "Input: “Suggest restaurant in london” \n" +
  "```json\n" +
  "[\n" +
  '{ "title": "London", "type": "destination" }\n' +
  "]\n" +
  "```\n" +
  "Input: “indian restaurant like Dishoom in New York” \n" +
  "```json\n" +
  "[\n" +
  '{ "title": "New York", "type": "destination" }\n' +
  `{ "title": "Dishoom", "type": "place" }\n` +
  "]\n" +
  "```\n" +
  "If you can’t identify any title/type pairs, respond with an empty array: []";

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
  console.log("SEARCH TAG RESULTS", results);
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

  const dbParts = latest.parts
    .filter(isTextPart)
    .map((p) => ({ content: p.text }));
  // await saveMessage(dbParts, latest.role, userId);

  const { text: intentText } = await generateText({
    model: openrouter("meta-llama/llama-3.3-70b-instruct"),
    system: systemPrompt,
    messages: convertToModelMessages([latest]),
    temperature: 0,
  });
  console.log("TEXT:", intentText);
  let intents: Intent[];
  try {
    const parsed = JSON.parse(intentText);
    if (!Array.isArray(parsed)) {
      throw new Error("Parsed intent is not an array");
    }
    intents = parsed;
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Could not parse intent JSON" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // if (intents.length === 0) {
  //   return new Response(JSON.stringify({ error: "No valid intents found" }), {
  //     status: 400,
  //     headers: { "Content-Type": "application/json" },
  //   });
  // }
  if (intents.length === 0) {
    const { text: extractedKeywords } = await generateText({
      model: openrouter("meta-llama/llama-3.3-70b-instruct"),
      system: keywordExtractorSystemPrompt,
      messages: convertToModelMessages([latest]),
      temperature: 0,
    });
    console.log("AI EXTRACTED KEYOWRD:", extractedKeywords);
    const keywords: string[] = JSON.parse(extractedKeywords);
    const tagIdLists = await Promise.all(
      keywords.map((kw) => searchTags(kw, 3))
    );
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
      "urn:tag:category:place:italian_restaurant" +
      "urn:tag:offerings:place:vegan_options" +
      "urn:tag:genre:place:restaurant:italian" +
      "]" +
      "```" +
      "You should not return anything other the comma separated array" +
      "Ideally add around 10 tag ids" +
      "Return a JSON array containing **only** the tag IDs that truly match the user’s request (nothing else).".trim();

    const { text: filteredJson } = await generateText({
      model: openrouter("meta-llama/llama-3.3-70b-instruct"),
      system: filterPrompt,
      messages: [
        {
          role: "user",
          content: `Here is the list of tags: ${tagIds} and here is the user's query: ${latest.parts[0].text}`,
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

    const classificationPrompt = `
You are a classifier. Given the user’s query, output **exactly one** of: movie, book, artist, brand, podcast, tv_show, game, destination, person, place.
No extra text or JSON—just the single word.
`;

    const { text: typeText } = await generateText({
      model: openrouter("meta-llama/llama-4-maverick"),
      system: classificationPrompt,
      messages: modelInputs,
      temperature: 0,
    });
    const entityType = typeText.trim() as EntityType;

    const vibeyRecs = await fetchRecommendationsByTags({
      entityType,
      tagIds: finalTagIds,
      take: 5,
    });

    const recsJson = JSON.stringify(vibeyRecs, null, 2);
    const responseSystemPrompt = `
You are an AI Recommender Assistant.
Based on the user’s vibe/abstract query (“${latest}”), here are some recommendations:

${recsJson}

Now craft a friendly, concise reply listing and explaining them.
  `.trim();

    return streamText({
      model: openrouter("meta-llama/llama-4-maverick"),
      system: responseSystemPrompt,
      messages: modelInputs,
    }).toUIMessageStreamResponse();
  }

  const lookups = await Promise.all(
    intents.map(({ title, type }) => searchQloo({ title, entityType: type }))
  );
  const validEntities = lookups.filter(
    (
      r
    ): r is {
      entityId: string;
      name: string;
      location: {
        lat: number;
        lon: number;
      };
    } => r !== null
  );
  console.log("VALID ENTITIES PLACES", validEntities);
  if (validEntities.length === 0) {
    return new Response(JSON.stringify({ error: "No entities found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

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
    "urn:tag:category:place:italian_restaurant" +
    "urn:tag:offerings:place:vegan_options" +
    "urn:tag:genre:place:restaurant:italian" +
    "]" +
    "```" +
    "You should not return anything other the comma separated array" +
    "Ideally add around 10 tag ids" +
    "Return a JSON array containing **only** the tag IDs that truly match the user’s request (nothing else).".trim();

  const { text: filteredJson } = await generateText({
    model: openrouter("meta-llama/llama-3.3-70b-instruct"),
    system: filterPrompt,
    messages: [
      {
        role: "user",
        content: `Here is the list of tags: ${tagIds} and here is the user's query: ${latest.parts[0].text}`,
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

  const groupedByType: Record<EntityType, typeof validEntities> = {} as any;

  validEntities.forEach((ent, idx) => {
    const type = intents[idx].type as EntityType;
    if (!groupedByType[type]) groupedByType[type] = [];
    groupedByType[type].push(ent);
  });

  // 2) Fire off a recommendation request per type, pulling location from the first entity in each group
  const recLists = await Promise.all(
    Object.entries(groupedByType).map(([type, entities]) => {
      // Pick the first entity’s coords
      const { lat, lon } = entities[0].location;

      return fetchRecommendationsWithEntitiesAndTags({
        entityType: "place",
        entityIds: entities.map((e) => e.entityId),
        tagIds: finalTagIds,
        // Two-element [lat, lon] → your helper turns it into WKT POINT(lon lat)
        location: [lat.toString(), lon.toString()],
        take: 5,
      });
    })
  );
  const combinedRecs = recLists.flat();
  const recsJson = JSON.stringify(combinedRecs, null, 2);
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
        content: `Here is the user's query: ${latest.parts[0].text} and here are the recommendation: ${recsJson}`,
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
  const {
    entity_id,
    name,
    location,
  } = first as {
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

async function fetchRecommendationsWithEntitiesAndTags({
  entityType,
  location,
  entityIds,
  tagIds,
  take = 5,
}: {
  entityType: EntityType;
  location: string[];
  entityIds: string[];
  tagIds: string[];
  take?: number;
}): Promise<any[]> {
  const urn = ENTITY_TYPES[entityType];
  const url = new URL(`${process.env.QLOO_BASE_URL}/v2/insights`);
  url.searchParams.set("filter.type", urn);
  url.searchParams.set("signal.interests.entities", entityIds.join(","));
  if (tagIds.length) {
    url.searchParams.set("signal.interests.tags", tagIds.join(","));
  }
  url.searchParams.set("take", String(take));

  if (location.length) {
    let locParam: string;

    if (location.length === 1) {
      locParam = location[0];
    } else if (location.length === 2) {
      // [lat, lon] → WKT POINT(lon lat)
      const [lat, lon] = location;
      locParam = `POINT(${lon} ${lat})`;
    } else {
      locParam = location[0];
    }

    url.searchParams.set("signal.location", locParam);
  }

  const res = await fetch(url.toString(), {
    headers: {
      "X-Api-Key": process.env.QLOO_API_KEY!,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) return [];
  const data = await res.json();
  console.log("FETCH Rec BY ID and TAgs", data.results.entities);
  return data.results.entities;
}


