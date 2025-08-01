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
  movie: "urn:entity:movie",
  book: "urn:entity:book",
  artist: "urn:entity:artist",
  brand: "urn:entity:brand",
  podcast: "urn:entity:podcast",
  tvShow: "urn:entity:tv_show",
  game: "urn:entity:videogame",
  destination: "urn:entity:destination",
  person: "urn:entity:person",
  place: "urn:entity:place",
} as const;
type EntityType = keyof typeof ENTITY_TYPES;

export const maxDuration = 60;

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY!,
  //   extraBody: {
  //     include_reasoning: true,
  //   },
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
  "Output **must** be a JSON array of objects with keys **title** and **type** (e.g. movie, book, artist, brand, podcast, tv_show, game, destination, person, place). \n" +
  "When the user sends a query, you **must** emit exactly one JSON array of objects (no prose, no markdown, no extra fields) with these two properties:\n\n" +
  '• "title" (string) – the name of the thing the user is asking about\n' +
  '• "type" (string) – one of: movie, book, artist, brand, podcast, tv_show, game, destination, person, place\n\n' +
  "For city, country etc etc destination should be used and for restaurant, museums etc place should be used. ";
"Make sure your output is valid JSON (double‑quoted keys and strings) and contains **only** that array.\n\n" +
  "Example:\n" +
  "Input: “Suggest brands similar to Yves Saint Laurent” \n" +
  "```json\n" +
  "[\n" +
  '{ "title": "Yves Saint Laurent", "type": "brand" }\n' +
  "]\n" +
  "```\n" +
  "Input: “Suggest movies similar to Inception and The Matrix” \n" +
  "```json\n" +
  "[\n" +
  '{ "title": "Inception", "type": "movie" }\n' +
  `{ "title": "The Matrix", "type": "movie" }\n` +
  "]\n" +
  "```\n" +
  "Input: “Some movie that a teenager will enjoy, not too much violence” \n" +
  "```json\n" +
  "[]\n" +
  "```\n" +
  "Input: “Fun movie to watch on the weekend, ideally comedy” \n" +
  "```json\n" +
  "[]\n" +
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
  // console.log("SEARCH TAGS");
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
  // console.log("MESSAGE", messages);
  // console.log("USER ID FROM FE", userId);
  const latest = messages[messages.length - 1];
  // console.log("LATET", latest);
  const userQueryText = latest.parts.find(isTextPart)?.text ?? "";
  // 1. Take the last 3 (or fewer, if there aren’t yet three)
  const lastThree = messages.slice(-3);

  // 2. For intent parsing or keyword extraction, feed in all three:
  const modelInputs = convertToModelMessages(lastThree);
  const dbParts = latest.parts
    .filter(isTextPart)
    .map((p) => ({ content: p.text }));
  // await saveMessage(dbParts, latest.role, userId);

  const { text: intentText } = await generateText({
    model: openrouter("meta-llama/llama-3.3-70b-instruct"),
    system: systemPrompt,
    messages: modelInputs,
    temperature: 0,
  });
  // console.log("TEXT:", intentText);
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
    // console.log("AI EXTRACTED KEYOWRD:", extractedKeywords);
    const keywords: string[] = JSON.parse(extractedKeywords);
    const tagIdLists = await Promise.all(
      keywords.map((kw) => searchTags(kw, 3))
    );
    // console.log("TAG ID LIST", tagIdLists);
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
          content: `Here is the list of tags: ${tagIds} and here is the user's query: ${userQueryText}`,
        },
      ],
      temperature: 0,
    });

    // console.log("AI FIltered tags:", filteredJson);
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
    (r): r is { entityId: string; name: string } => r !== null
  );
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
  // console.log("AI EXTRACTED KEYOWRD:", extractedKeywords);
  const keywords: string[] = JSON.parse(extractedKeywords);
  const tagIdLists = await Promise.all(keywords.map((kw) => searchTags(kw, 3)));
  // console.log("TAG ID LIST", tagIdLists);
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
        content: `Here is the list of tags: ${tagIds} and here is the user's query: ${userQueryText}`,
      },
    ],
    temperature: 0,
  });

  // console.log("AI FIltered tags:", filteredJson);

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

  const groupedByType: Record<EntityType, string[]> = {} as any;

  validEntities.forEach((ent, idx) => {
    const type = intents[idx].type;
    if (!groupedByType[type]) groupedByType[type] = [];
    groupedByType[type].push(ent.entityId);
  });
  const recLists = await Promise.all(
    Object.entries(groupedByType).map(([type, entityIds]) =>
      fetchRecommendationsWithEntitiesAndTags({
        entityType: type as EntityType,
        entityIds,
        tagIds: finalTagIds,
        take: 5,
      })
    )
  );
  const combinedRecs = recLists.flat();
  const recsJson = JSON.stringify(combinedRecs, null, 2);
  const responseSystemPrompt =
    "You are an AI Recommender Assistant.\n" +
    "You are to answer to the user based on the Data we got from Qloo.\n" +
    // `Based on the user's input, here are combined Qloo recommendations: ${recsJson}\n` +
    "Now craft a friendly,detailed,  concise natural-language reply that explains and lists them, including available ratings, details, platforms etc etc.";

  const response = streamText({
    model: openrouter("meta-llama/llama-4-maverick"),
    system: responseSystemPrompt,
    messages: [
      {
        role: "user",
        content: `Here is the user's query: ${userQueryText} and here are the recommendation: ${recsJson}`,
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
  // console.log("Search JSON", json);
  const first = Array.isArray(json.results) && json.results[0];

  if (!first) return null;

  return {
    entityId: String(first.entity_id),
    name: first.name,
  };
};

interface SlimMovie {
  name: string;
  releaseYear?: number;
  releaseDate?: string;
  description?: string;
  contentRating?: string;
  duration?: number;
  ratings?: {
    rottenTomatoes?: { critic: number; user: number };
    imdb?: { rating: number; votes: number };
  };
}

interface SlimEntity {
  entityId: string;
  name: string;
  type: EntityType;
  shortDescription?: string;
  imageUrl?: string;
  tags?: { id: string; name: string }[];
  external?: any;
  metadata?: Record<string, any>;
}

function slimMovie(ent: any): SlimEntity {
  const p = ent.properties || {};
  const ext = ent.external || {};
  const rt = ext.rottentomatoes?.[0];
  const im = ext.imdb?.[0];
  return {
    entityId: ent.entity_id,
    name: ent.name,
    type: "movie",
    shortDescription: p.description,
    imageUrl: p.image?.url,
    tags: ent.tags?.map((t: any) => ({ id: t.id, name: t.name })),
    external: {
      imdb: ext.imdb?.[0],
      rottenTomatoes: { critic: rt?.critic_rating, user: rt?.user_rating },
    },
    metadata: {
      releaseDate: p.release_date,
      releaseYear: p.release_year,
      contentRating: p.content_rating,
      duration: p.duration,
      imdbRating: im?.user_rating,
      imdbVotes: im?.user_rating_count,
    },
  };
}
function slimVideoGame(ent: any): SlimEntity {
  const { akas, ...props } = ent.properties || {};
  return {
    entityId: ent.entity_id,
    name: ent.name,
    type: "game",
    shortDescription: props.description,
    imageUrl: props.image?.url,
    external: ent.external,
    metadata: props,
  };
}
function slimBook(ent: any): SlimEntity {
  const p = ent.properties || {};
  return {
    entityId: ent.entity_id,
    name: ent.name,
    type: "book",
    shortDescription: p.short_description || p.description,
    imageUrl: p.image?.url,
    tags: ent.tags?.map((t: any) => ({ id: t.id, name: t.name })),
    external: ent.external,
    metadata: {
      isbn10: p.isbn10,
      isbn13: p.isbn13,
      pageCount: p.page_count,
      language: p.language,
      publicationDate: p.publication_date,
      publisher: p.publisher,
      format: p.format,
    },
  };
}

function slimBrand(ent: any): SlimEntity {
  const p = ent.properties || {};
  return {
    entityId: ent.entity_id,
    name: ent.name,
    type: "brand",
    shortDescription: p.short_description,
    imageUrl: p.image?.url,
    tags: ent.tags?.map((t: any) => ({ id: t.id, name: t.name })),
    metadata: {
      headquartered: p.headquartered,
      inception: p.inception,
      industry: p.industry,
      officialSite: p.official_site,
      parentOrganization: p.parent_organization,
      ownedBy: p.owned_by,
      products: p.products,
    },
    external: ent.external,
  };
}

function slimDownEntities(raw: any, entityType: EntityType): SlimEntity[] {
  if (!raw?.results?.entities) return [];
  return raw.results.entities.map((ent: any) => {
    switch (entityType) {
      case "movie":
        return slimMovie(ent);
      case "book":
        return slimBook(ent);
      case "brand":
        return slimBrand(ent);
      case "game":
        return slimVideoGame(ent);
      default:
        return {
          entityId: ent.entity_id,
          name: ent.name,
          type: entityType,
          shortDescription:
            ent.properties?.short_description || ent.properties?.description,
          imageUrl: ent.properties?.image?.url,
          tags: ent.tags?.map((t: any) => ({ id: t.id, name: t.name })),
          metadata: ent.properties,
          external: ent.external,
        };
    }
  });
}

const fetchRecommendationsBatch = async ({
  entityType,
  entityIds,
  take = 5,
}: {
  entityType: EntityType;
  entityIds: string[];
  take?: number;
}): Promise<SlimMovie[]> => {
  const urn = ENTITY_TYPES[entityType];

  const params = new URLSearchParams({
    "filter.type": urn,
    "signal.interests.entities": entityIds.join(","),
    take: take.toString(),
  });

  const url = `${process.env.QLOO_BASE_URL}/v2/insights?${params.toString()}`;

  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": process.env.QLOO_API_KEY!,
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("Qloo recommendations error:", errText);
    return [];
  }

  const data = await res.json();
  // console.log("BATCH REC:", data.results.entities);
  return slimDownEntities(data, entityType);
};

interface FetchByTagsOpts {
  entityType: EntityType;
  tagIds: string[];
  take?: number;
}

async function fetchRecommendationsByTags({
  entityType,
  tagIds,
  take = 5,
}: FetchByTagsOpts): Promise<SlimEntity[]> {
  const urn = ENTITY_TYPES[entityType];
  const url = new URL(`${process.env.QLOO_BASE_URL}/v2/insights`);
  url.searchParams.set("filter.type", urn);
  url.searchParams.set("filter.tags", tagIds.join(","));
  url.searchParams.set("take", String(take));
  // console.log("FETCH REC BY tags");
  // console.log("Tags", tagIds.join(","));
  const res = await fetch(url.toString(), {
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": process.env.QLOO_API_KEY!,
    },
  });
  if (!res.ok) return [];
  const data = await res.json();
  // console.log("FETCH REC TAGS", data.results.entities);
  return slimDownEntities(data, entityType);
}

async function fetchRecommendationsWithEntitiesAndTags({
  entityType,
  entityIds,
  tagIds,
  take = 5,
}: {
  entityType: EntityType;
  entityIds: string[];
  tagIds: string[];
  take?: number;
}): Promise<SlimEntity[]> {
  const urn = ENTITY_TYPES[entityType];
  const url = new URL(`${process.env.QLOO_BASE_URL}/v2/insights`);
  url.searchParams.set("filter.type", urn);
  url.searchParams.set("signal.interests.entities", entityIds.join(","));
  if (tagIds.length)
    url.searchParams.set("signal.interests.tags", tagIds.join(","));
  url.searchParams.set("take", String(take));

  const res = await fetch(url.toString(), {
    headers: {
      "X-Api-Key": process.env.QLOO_API_KEY!,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) return [];
  const data = await res.json();
  // console.log("FETCH REc BY ID and TAgs", data.results.entities);
  return slimDownEntities(data, entityType);
}

async function fetchRecommendationsDynamic({
  destinationTitle,
  cuisineTagIds,
  placeEntityIds,
  take = 5,
}: {
  destinationTitle?: string;
  cuisineTagIds: string[];
  placeEntityIds?: string[];
  take?: number;
}): Promise<SlimEntity[]> {
  const url = new URL(`${process.env.QLOO_BASE_URL}/v2/insights`);

  // 1. Always filter by place entities (restaurants, museums)
  url.searchParams.set("filter.type", ENTITY_TYPES.place);

  // 2. Dynamically resolve and filter by the destination entity
  if (destinationTitle) {
    const city = await searchQloo({
      title: destinationTitle,
      entityType: "destination",
    });
    if (city?.entityId) {
      url.searchParams.set("filter.entities", city.entityId);
    }
  }

  // 3. Boost by cuisine-specific tags (Indian restaurant, etc.)
  if (cuisineTagIds.length) {
    url.searchParams.set("signal.interests.tags", cuisineTagIds.join(","));
  }

  // 4. Optionally include any pre-resolved place entity IDs for personalization
  if (placeEntityIds && placeEntityIds.length) {
    url.searchParams.set("signal.interests.entities", placeEntityIds.join(","));
  }

  url.searchParams.set("take", String(take));

  const res = await fetch(url.toString(), {
    headers: {
      "X-Api-Key": process.env.QLOO_API_KEY!,
      "Content-Type": "application/json",
    },
  });
  const data = await res.json();
  // console.log("FETCH REC DYNAMIC", data.results.entities);
  return slimDownEntities(data, "place");
}
