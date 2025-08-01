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
  "Output **must** be a JSON array of objects with keys **title** and **type** (e.g. movie, book, artist, brand, podcast, tvShow, game, destination, person, place). \n" +
  "When the user sends a query, you **must** emit exactly one JSON array of objects (no prose, no markdown, no extra fields) with these two properties:\n\n" +
  '• "title" (string) – the name of the thing the user is asking about\n' +
  '• "type" (string) – one of: movie, book, artist, brand, podcast, tvShow, game, destination, person, place\n\n' +
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
  "If you can’t identify any title/type pairs, respond with an empty array: []";
type Intent = { title: string; type: EntityType };
interface TextPart {
  type: "text";
  text: string;
}

function isTextPart(p: UIMessagePart<UIDataTypes, UITools>): p is TextPart {
  return p.type === "text";
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

  if (intents.length === 0) {
    return new Response(JSON.stringify({ error: "No valid intents found" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
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

  const groupedByType: Record<EntityType, string[]> = {} as any;

  validEntities.forEach((ent, idx) => {
    const type = intents[idx].type;
    if (!groupedByType[type]) groupedByType[type] = [];
    groupedByType[type].push(ent.entityId);
  });

  // Fetch recommendations for each entity and merge
  //   const recLists = await Promise.all(
  //     validEntities.map(({ entityId }, idx) =>
  //       fetchRecommendations({
  //         entityId,
  //         entityType: intents[idx].type,
  //         take: 5,
  //       })
  //     )
  //   );
  const recLists = await Promise.all(
    Object.entries(groupedByType).map(([type, entityIds]) =>
      fetchRecommendationsBatch({
        entityType: type as EntityType,
        entityIds,
        take: 5,
      })
    )
  );
  const combinedRecs = recLists.flat();
  const recsJson = JSON.stringify(combinedRecs, null, 2);
  const responseSystemPrompt =
    "You are an AI Recommender Assistant.\n" +
    "You are to answer to the user based on the Data we got from Qloo.\n" +
    `Based on the user's input, here are combined Qloo recommendations: ${recsJson}\n` +
    "Now craft a friendly,detailed,  concise natural-language reply that explains and lists them, including available ratings, details, platforms etc etc.";

  const response = streamText({
    model: openrouter("meta-llama/llama-4-maverick"),
    system: responseSystemPrompt,
    messages: convertToModelMessages([latest]),
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

// function slimDownEntities(raw: any): SlimMovie[] {
//   if (!raw?.results?.entities) return [];
//   return raw.results.entities.map((ent: any) => {
//     const p = ent.properties || {};
//     const ext = ent.external || {};
//     const rt = ext.rottentomatoes?.[0];
//     const im = ext.imdb?.[0];

//     return {
//       name: ent.name,
//       releaseYear: p.release_year,
//       releaseDate: p.release_date,
//       description: p.description,
//       contentRating: p.content_rating,
//       duration: p.duration,
//       ratings: {
//         rottenTomatoes: rt
//           ? { critic: Number(rt.critic_rating), user: Number(rt.user_rating) }
//           : undefined,
//         imdb: im
//           ? { rating: im.user_rating, votes: im.user_rating_count }
//           : undefined,
//       },
//     };
//   });
// }
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
  // 1. Destructure out `akas`, keeping everything else in `props`
  const { akas, ...props } = ent.properties || {};

  // 2. Build and return your SlimEntity, omitting ent.tags completely
  return {
    entityId: ent.entity_id,
    name: ent.name,
    type: "game",
    shortDescription: props.description, // use description if available
    imageUrl: props.image?.url, // copy any image URL
    external: ent.external, // preserve external IDs
    metadata: props, // all other properties except akas
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
      // add cases for podcast, artist, tvShow, game, destination, person, place…
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
  console.log("BATCH REC:", data);
  return slimDownEntities(data, entityType);
};

// const fetchRecommendations = async ({
//   entityId,
//   entityType,
//   take = 5,
// }: {
//   entityId: string;
//   entityType: EntityType;
//   take?: number;
// }): Promise<SlimMovie[]> => {
//   const urn = ENTITY_TYPES[entityType];

//   const params = new URLSearchParams({
//     "filter.type": urn,
//     "signal.interests.entities": entityId,
//     take: take.toString(),
//   });

//   const url = `${process.env.QLOO_BASE_URL}/v2/insights?${params.toString()}`;

//   const res = await fetch(url, {
//     headers: {
//       "Content-Type": "application/json",
//       "X-Api-Key": process.env.QLOO_API_KEY!,
//     },
//   });
//   if (!res.ok) {
//     const errText = await res.text();
//     console.error("Qloo recommendations error:", errText);
//     return [];
//   }

//   const data = await res.json();
//   console.log("REC DATA", data.results);
//   return slimDownEntities(data);
// };
