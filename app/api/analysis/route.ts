import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import {
  convertToModelMessages,
  extractReasoningMiddleware,
  generateText,
  streamText,
  UIMessage,
  wrapLanguageModel,
} from "ai";

const ENTITY_TYPES = {
  movie: "urn:entity:movie",
  book: "urn:entity:book",
  artist: "urn:entity:artist",
  brand: "urn:entity:brand",
  podcast: "urn:entity:podcast",
  tvShow: "urn:entity:tvshow",
  game: "urn:entity:videogame",
  destination: "urn:entity:destination",
  person: "urn:entity:person",
  place: "urn:entity:place",
} as const;
type EntityType = keyof typeof ENTITY_TYPES;

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY!,
});
const model = wrapLanguageModel({
  model: openrouter("meta-llama/llama-4-maverick"),
  middleware: extractReasoningMiddleware({ tagName: "reasoning" }),
});

const systemPrompt =
  "You are the Qloo AI Recommender’s “intent parser.”\n" +
  "When the user sends a query, you **must** emit exactly one JSON object (no prose, no markdown, no extra fields) with these two properties:\n\n" +
  '• "title" (string) – the name of the thing the user is asking about\n' +
  '• "type" (string) – one of: movie, book, artist, brand, podcast, tvShow, game, destination, person, place\n\n' +
  "Make sure your output is valid JSON (double‑quoted keys and strings) and contains **only** those two keys.\n\n" +
  "Example outputs:\n" +
  "```json\n" +
  '{ "title": "Inception", "type": "movie" }\n' +
  "```\n" +
  "```json\n" +
  '{ "title": "The Beatles", "type": "artist" }\n' +
  "```\n\n" +
  "If you can’t identify both a title and one of the allowed types, respond with empty strings:\n" +
  "```json\n" +
  '{ "title": "", "type": "" }\n' +
  "```";

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  const latest = messages[messages.length - 1];
  console.log("LATET", latest);
  const { text } = await generateText({
    model: openrouter("meta-llama/llama-3.3-70b-instruct"),
    system: systemPrompt,
    messages: convertToModelMessages([latest]),
  });
  console.log("TEXT:", text);
  let intent: { title: string; type: EntityType };
  try {
    intent = JSON.parse(text);
  } catch {
    return new Response(
      JSON.stringify({ error: "Could not parse intent JSON" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  const lookupResult = await searchQloo({
    title: intent.title,
    entityType: intent.type,
  });
  console.log("LOOKUP", lookupResult);
  if (!lookupResult) {
    return new Response(JSON.stringify({ error: "No entity found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const recs = await fetchRecommendations({
    entityId: lookupResult.entityId,
    entityType: intent.type,
    take: 5,
  });
  console.log("REC", recs);
  const recsJson = JSON.stringify(recs, null, 2);
  const responseSystemPrompt =
    "You are a AI Recommender Assistant. \n " +
    `Based on user's input, you MUST only answer from the recommendations from Qloo. The recommendation Qloo provided are: ${recsJson} \n ` +
    "Now craft a friendly, concise natural‑language reply that explains and lists them. In your answer provide information about the movie like its rating and stuff if that exist";

  const response = streamText({
    model,
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
  // now this lines up perfectly with your key on ENTITY_TYPES
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
  // console.log("RES Search", res);
  const json = await res.json();
  console.log("RES JSON", json);
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

function slimDownEntities(raw: any): SlimMovie[] {
  if (!raw?.results?.entities) return [];
  return raw.results.entities.map((ent: any) => {
    const p = ent.properties || {};
    const ext = ent.external || {};
    const rt = ext.rottentomatoes?.[0];
    const im = ext.imdb?.[0];

    return {
      name: ent.name,
      releaseYear: p.release_year,
      releaseDate: p.release_date,
      description: p.description,
      contentRating: p.content_rating,
      duration: p.duration,
      ratings: {
        rottenTomatoes: rt
          ? { critic: Number(rt.critic_rating), user: Number(rt.user_rating) }
          : undefined,
        imdb: im
          ? { rating: im.user_rating, votes: im.user_rating_count }
          : undefined,
      },
    };
  });
}

const fetchRecommendations = async ({
  entityId,
  entityType,
  take = 5,
}: {
  entityId: string;
  entityType: EntityType;
  take?: number;
}): Promise<SlimMovie[]> => {
  const urn = ENTITY_TYPES[entityType];

  const params = new URLSearchParams({
    "filter.type": urn,
    "signal.interests.entities": entityId,
    take: take.toString(),
  });

  const url = `${process.env.QLOO_BASE_URL}/v2/insights?${params.toString()}`;

  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": process.env.QLOO_API_KEY!,
    },
  });
  console.log("RES", res);
  if (!res.ok) {
    const errText = await res.text();
    console.error("Qloo recommendations error:", errText);
    return [];
  }

  const data = await res.json();
  return slimDownEntities(data);
};

