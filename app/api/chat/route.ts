// import { entityIdLookup, getRecommendationsByEntityId } from "@/lib/qlooTools";
// import { createTogetherAI } from "@ai-sdk/togetherai";
// import { createOpenRouter } from "@openrouter/ai-sdk-provider";
// import {
//   convertToModelMessages,
//   extractReasoningMiddleware,
//   stepCountIs,
//   streamText,
//   UIMessage,
//   wrapLanguageModel,
// } from "ai";

// export const maxDuration = 60;

// const openrouter = createOpenRouter({
//   apiKey: process.env.OPENROUTER_API_KEY,
// });

// const togetherai = createTogetherAI({
//   apiKey: process.env.TOGETHER_AI_API!,
// });

// // const systemPrompt =
// //   "You are a movie recommendation assistant. You have two tools:\n" +
// //   "\n" +
// //   "1. entityLookup\n" +
// //   '   • Input schema: { "title": "<string>" }\n' +
// //   '   • Returns: { "entityId": "<string>", "name": "<string>" }\n' +
// //   "\n" +
// //   "2. getRecommendations\n" +
// //   '   • Input schema: { "entityId": "<string>", "take": <number> }\n' +
// //   "   • Returns: JSON array of SlimMovie objects\n" +
// //   "\n" +
// //   "Whenever you need to call a tool, respond with EXACTLY one JSON object and NO extra text.  \n" +
// //   "Format each call like this:\n" +
// //   "{\n" +
// //   '  "tool_calls": [\n' +
// //   "    {\n" +
// //   '      "name": "<toolName>",\n' +
// //   '      "type": "function",\n' +
// //   '      "arguments": { /* your args here */ }\n' +
// //   "    }\n" +
// //   "  ]\n" +
// //   "}\n" +
// //   "\n" +
// //   "Step 1: When the user says a movie title, call **entityLookup**:\n" +
// //   "{\n" +
// //   '  "tool_calls": [\n' +
// //   '    { "name": "entityLookup", "type": "function", "arguments": { "title": "<Movie Title>" } }\n' +
// //   "  ]\n" +
// //   "}\n" +
// //   "\n" +
// //   'Step 2: After you get back { "entityId": "..." }, call **getRecommendations**:\n' +
// //   "{\n" +
// //   '  "tool_calls": [\n' +
// //   '    { "name": "getRecommendations", "type": "function", "arguments": { "entityId": "<entityId>", "take": <count> } }\n' +
// //   "  ]\n" +
// //   "}\n" +
// //   "\n" +
// //   "Step 3: Once you receive the recommendations array, output a friendly, conversational summary of each film (title, year, description, rating, etc.).\n" +
// //   "\n" +
// //   "No backticks, no commentary, no extra JSON during steps 1 & 2—only the prescribed JSON objects.  \n" +
// //   "After both tools have run, switch to plain text for your user reply.\n";
// const systemPrompt = `You are a movie recommender. Based on user's input you will recommend movies in a friendly tone. To provide the answer, you will need to use the available tools: ${entityIdLookup} and ${getRecommendationsByEntityId}. While responding the users provide a detail answer by providing ratings and other information about the movie.`;
// const model = wrapLanguageModel({
//   model: openrouter("meta-llama/llama-4-maverick"),
//   middleware: extractReasoningMiddleware({ tagName: "reasoning" }),
// });

// export async function POST(req: Request) {
//   const { messages }: { messages: UIMessage[] } = await req.json();
//   console.log("[agent] incoming messages:", messages);
//   const latest = messages[messages.length - 1];
//   console.log("LATEST", latest);
//   const response = streamText({
//     model,
//     tools: { entityIdLookup, getRecommendationsByEntityId },
//     system: systemPrompt,
//     messages: convertToModelMessages([latest]),
//     toolChoice: "auto",
//     // activeTools: ["entityIdLookup", "getRecommendationsByEntityId"],
//     stopWhen: stepCountIs(3),
//     //   prepareStep: ({ stepNumber }) => {
//     //     if (stepNumber === 1) {
//     //       // return {
//     //       //   model: openrouter("meta-llama/llama-3.3-70b-instruct"),
//     //       //   toolChoice: { type: "tool", toolName: "entityLookup" },
//     //       //   experimental_activeTools: ["entityLookup"],
//     //       // };
//     //       return { activeTools: ["entityIdLookup"] };
//     //     }
//     //     if (stepNumber === 2) {
//     //       // return {
//     //       //   // model: togetherai("meta-llama/Llama-3.3-70B-Instruct-Turbo"),
//     //       //   model: openrouter("nvidia/llama-3.1-nemotron-70b-instruct"),
//     //       //   toolChoice: { type: "tool", toolName: "getRecommendations" },
//     //       //   experimental_activeTools: ["getRecommendations"],
//     //       // };
//     //       return { activeTools: ["getRecommendationsByEntityId"] };
//     //     }
//     //     return { activeTools: [] };
//     //     // return {
//     //     //   model: openrouter("meta-llama/llama-4-maverick"),
//     //     //   experimental_activeTools: [],
//     //     // };
//     //   },
//     // });
//     prepareStep: async ({ stepNumber }) => {
//       if (stepNumber === 0) {
//         return {
//           model: openrouter("meta-llama/llama-4-scout"),
//           toolChoice: { type: "tool", toolName: "entityIdLookup" },
//         };
//       }
//       if (stepNumber === 1) {
//         return {
//           model: openrouter("meta-llama/llama-4-scout"),
//           toolChoice: {
//             type: "tool",
//             toolName: "getRecommendationsByEntityId",
//           },
//         };
//       }
//       return {};
//     },
//   });
//   return response.toUIMessageStreamResponse();
// }

// import { entityLookup, getRecommendations } from "@/lib/qlooTools";
// import { createOpenRouter } from "@openrouter/ai-sdk-provider";
// import {
//   convertToModelMessages,
//   extractReasoningMiddleware,
//   stepCountIs,
//   streamText,
//   UIMessage,
//   wrapLanguageModel,
// } from "ai";

// const openrouter = createOpenRouter({
//   apiKey: process.env.OPENROUTER_API_KEY!,
// });

// const model = wrapLanguageModel({
//   model: openrouter("meta-llama/llama-4-maverick"),
//   middleware: extractReasoningMiddleware({ tagName: "reasoning" }),
// });

// // const systemPrompt = `
// // You are a universal recommender.
// // Use these tools to find and fetch recommendations for any entity type:

// // 1) entityLookup
// //    • Input: { title, entityType, take }
// //    • Output: { entityId, name } or null

// // 2) getRecommendations
// //    • Input: { entityId, entityType, take }
// //    • Output: array of recommendation objects

// // Step 1: Call entityLookup.
// // Step 2: Call getRecommendations.
// // Step 3: Summarize results in a friendly tone.
// // `.trim();

// const systemPrompt = `
// You are a universal recommender.
// When the user asks for recommendations (movies, books, artists, etc.), you MUST follow these steps:

// 1) Think step-by-step, laying out your reasoning before calling any tool.
// 2) Call entityLookup:
//    • Input: { title, entityType, take }
//    • Output: { entityId, name } or null
// 3) Call getRecommendations:
//    • Input: { entityId, entityType, take }
//    • Output: array of recommendation objects
// 4) Summarize the final recommendations in a friendly tone, including any ratings or descriptions.

// ### Step-by-step reasoning:
// <model writes its chain of thought here>

// ### Tool calls:
// <model emits exactly one JSON tool call per step>
// When you emit the entityId in tool call JSON, always wrap it in quotes so it appears as a string.
// ### Final answer:
// <model’s user‑facing recommendation summary>
// `.trim();

// export async function POST(req: Request) {
//   const { messages }: { messages: UIMessage[] } = await req.json();
//   const latest = messages[messages.length - 1];

//   const response = streamText({
//     model,
//     tools: { entityLookup, getRecommendations },
//     system: systemPrompt,
//     messages: convertToModelMessages([latest]),
//     toolChoice: "required",
//     activeTools: ["entityLookup", "getRecommendations"],
//     stopWhen: stepCountIs(2),
//     prepareStep: async ({ stepNumber }) => {
//       if (stepNumber === 0) {
//         return { toolChoice: { type: "tool", toolName: "entityLookup" } };
//       }
//       if (stepNumber === 1) {
//         return { toolChoice: { type: "tool", toolName: "getRecommendations" } };
//       }
//       return {};
//     },
//   });

//   return response.toUIMessageStreamResponse();
// }

// pages/api/chat.ts (or app/api/chat/route.ts)

// import { verifyInput, entityLookup, getRecommendations } from "@/lib/qlooTools";
// import { createOpenRouter } from "@openrouter/ai-sdk-provider";
// import {
//   convertToModelMessages,
//   extractReasoningMiddleware,
//   stepCountIs,
//   streamText,
//   UIMessage,
//   wrapLanguageModel,
// } from "ai";

// const openrouter = createOpenRouter({
//   apiKey: process.env.OPENROUTER_API_KEY!,
// });
// const model = wrapLanguageModel({
//   model: openrouter("meta-llama/llama-4-maverick"),
//   middleware: extractReasoningMiddleware({ tagName: "reasoning" }),
// });

// const systemPrompt = `
// You are a universal recommender. Follow these steps exactly:

// 1. Call verifyInput(raw) to parse the user’s message.
//    - If it returns { error }, stop and reply with that error.
// 2. Otherwise call entityLookup({ title, entityType, take: 1 }).
// 3. Then call getRecommendations({ entityId, entityType, take: 5 }).
// 4. Finally, summarize the recommendations in plain text, including ratings and descriptions.

// Do NOT output any raw JSON yourself; use the function‑calling mechanism.
// `.trim();

// export async function POST(req: Request) {
//   const { messages }: { messages: UIMessage[] } = await req.json();
//   const latest = messages[messages.length - 1];

// const response = streamText({
//   model,
//   tools: { verifyInput, entityLookup, getRecommendations },
//   system: systemPrompt,
//   messages: convertToModelMessages([latest]),
//   toolChoice: "required", // force a tool call each step :contentReference[oaicite:1]{index=1}
//   activeTools: ["verifyInput", "entityLookup", "getRecommendations"],
//   stopWhen: stepCountIs(3), // exactly 3 calls: verify → lookup → recommend :contentReference[oaicite:2]{index=2}
//   prepareStep: ({ stepNumber }) => {
//     if (stepNumber === 0) {
//       return { toolChoice: { type: "tool", toolName: "verifyInput" } };
//     }
//     if (stepNumber === 1) {
//       return { toolChoice: { type: "tool", toolName: "entityLookup" } };
//     }
//     if (stepNumber === 2) {
//       return { toolChoice: { type: "tool", toolName: "getRecommendations" } };
//     }
//     return {};
//   },
// });

// return response.toUIMessageStreamResponse();
// }

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
  tvShow: "urn:entity:tv_show",
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

// const systemPrompt =
//   "You are the Qloo AI Recommender’s “intent parser.”\n" +
//   "When the user sends a query, you **must** emit exactly one JSON object (no prose, no markdown, no extra fields) with these two properties:\n\n" +
//   '• "title" (string) – the name of the thing the user is asking about\n' +
//   '• "type" (string) – one of: movie, book, artist, brand, podcast, tvShow, game, destination, person, place\n\n' +
//   "Make sure your output is valid JSON (double‑quoted keys and strings) and contains **only** those two keys.\n\n" +
//   "Example outputs:\n" +
//   "```json\n" +
//   '{ "title": "Inception", "type": "movie" }\n' +
//   "```\n" +
//   "```json\n" +
//   '{ "title": "The Beatles", "type": "artist" }\n' +
//   "```\n\n" +
//   "If you can’t identify both a title and one of the allowed types, respond with empty strings:\n" +
//   "```json\n" +
//   '{ "title": "", "type": "" }\n' +
//   "```";
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

export async function POST(req: Request) {
  const {
    id,
    messages,
  }: {
    id: string;
    messages: UIMessage[];
  } = await req.json();
  console.log("MESSAGE", messages);
  const latest = messages[messages.length - 1];
  console.log("LATET", latest);
  const { text: intentText } = await generateText({
    model: openrouter("meta-llama/llama-3.3-70b-instruct"),
    system: systemPrompt,
    messages: convertToModelMessages([latest]),
    temperature: 0,
  });
  console.log("TEXT:", intentText);
  // let intent: { title: string; type: EntityType };
  // try {
  //   intent = JSON.parse(text);
  // } catch {
  //   return new Response(
  //     JSON.stringify({ error: "Could not parse intent JSON" }),
  //     { status: 400, headers: { "Content-Type": "application/json" } }
  //   );
  // }
  // const lookupResult = await searchQloo({
  //   title: intent.title,
  //   entityType: intent.type,
  // });
  // console.log("LOOKUP", lookupResult);
  // if (!lookupResult) {
  //   return new Response(JSON.stringify({ error: "No entity found" }), {
  //     status: 404,
  //     headers: { "Content-Type": "application/json" },
  //   });
  // }
  // const recs = await fetchRecommendations({
  //   entityId: lookupResult.entityId,
  //   entityType: intent.type,
  //   take: 5,
  // });
  // console.log("REC", recs);
  //  const recsJson = JSON.stringify(recs, null, 2);
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

  // Fetch recommendations for each entity and merge
  const recLists = await Promise.all(
    validEntities.map(({ entityId }, idx) =>
      fetchRecommendations({
        entityId,
        entityType: intents[idx].type,
        take: 5,
      })
    )
  );
  const combinedRecs = recLists.flat();
  const recsJson = JSON.stringify(combinedRecs, null, 2);
  // const responseSystemPrompt =
  //   "You are a AI Recommender Assistant. \n " +
  //   `Based on user's input, you MUST only answer from the recommendations from Qloo. The recommendation Qloo provided are: ${recsJson} \n ` +
  //   "Now craft a friendly, concise natural‑language reply that explains and lists them. In your answer provide information about the movie like its rating and stuff if that exist";
  const responseSystemPrompt =
    "You are an AI Recommender Assistant.\n" +
    `Based on the user's input, here are combined Qloo recommendations from all provided seeds: ${recsJson}\n` +
    "Now craft a friendly, concise natural-language reply that explains and lists them, including available ratings and details.";

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
  if (!res.ok) {
    const errText = await res.text();
    console.error("Qloo recommendations error:", errText);
    return [];
  }

  const data = await res.json();
  console.log("REC DATA", data.results);
  return slimDownEntities(data);
};

// import { createOpenRouter } from "@openrouter/ai-sdk-provider";
// import {
//   convertToModelMessages,
//   extractReasoningMiddleware,
//   generateText,
//   streamText,
//   UIMessage,
//   wrapLanguageModel,
//   generateObject,
// } from "ai";

// import { z } from "zod";

// // Entity type definitions
// const ENTITY_TYPES = {
//   movie: "urn:entity:movie",
//   book: "urn:entity:book",
//   artist: "urn:entity:artist",
//   brand: "urn:entity:brand",
//   podcast: "urn:entity:podcast",
//   tvShow: "urn:entity:tvshow",
//   game: "urn:entity:videogame",
//   destination: "urn:entity:destination",
//   person: "urn:entity:person",
//   place: "urn:entity:place",
// } as const;
// type EntityType = keyof typeof ENTITY_TYPES;

// // Initialize OpenRouter
// const openrouter = createOpenRouter({
//   apiKey: process.env.OPENROUTER_API_KEY!,
// });

// // ====================
// // Worker Agents
// // ====================

// /**
//  * Intent Parser Worker
//  * Extracts entity title and type from user message
//  */
// async function intentParserWorker(userInput: string) {
//   const { object } = await generateObject({
//     model: openrouter("meta-llama/llama-3.3-70b-instruct"),
//     schema: z.object({
//       title: z.string(),
//       type: z.enum(Object.keys(ENTITY_TYPES) as [EntityType, ...EntityType[]]),
//     }),
//     system:
//       "Parse user intent into title and entity type. Return empty strings if unclear.",
//     prompt: userInput,
//   });

//   return object;
// }

// /**
//  * Qloo Search Worker
//  * Finds entity ID from Qloo API
//  */
// async function qlooSearchWorker(title: string, entityType: EntityType) {
//   const urn = ENTITY_TYPES[entityType];
//   const url = `${process.env.QLOO_BASE_URL}/search?query=${encodeURIComponent(
//     title
//   )}&types=${encodeURIComponent(urn)}&take=2`;

//   const res = await fetch(url, {
//     headers: {
//       "Content-Type": "application/json",
//       "X-Api-Key": process.env.QLOO_API_KEY!,
//     },
//   });

//   const json = await res.json();
//   console.log("SEARCH", json);
//   const firstResult = Array.isArray(json.results) ? json.results[0] : null;

//   return firstResult
//     ? {
//         entityId: String(firstResult.entity_id),
//         name: firstResult.name,
//       }
//     : null;
// }

// /**
//  * Recommendations Worker
//  * Fetches recommendations from Qloo API
//  */
// async function recommendationsWorker(entityId: string, entityType: EntityType) {
//   const urn = ENTITY_TYPES[entityType];
//   const params = new URLSearchParams({
//     "filter.type": urn,
//     "signal.interests.entities": entityId,
//     take: "5",
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
//    console.log("REC DATA", data);
//   return slimDownEntities(data);
// }

// /**
//  * Response Generator Worker
//  * Creates streaming response with recommendations
//  */
// function responseGeneratorWorker(recs: SlimMovie[], userInput: string) {
//   const recsJson = JSON.stringify(recs, null, 2);
//   return streamText({
//     model: openrouter("meta-llama/llama-4-maverick"),
//     system: `You're an AI recommender. Use ONLY these Qloo recommendations: ${recsJson}.
//              Format response with:
//              1. Introduction mentioning the requested item
//              2. Bullet-point list of recommendations with ratings
//              3. Short description for each`,
//     prompt: userInput,
//   });
// }

// /**
//  * Error Handler Worker
//  * Generates fallback response when main flow fails
//  */
// function errorHandlerWorker(error: Error, userInput: string) {
//   return streamText({
//     model: openrouter("meta-llama/llama-4-maverick"),
//     system: "Apologize and explain you couldn't complete the request",
//     prompt: `Error: ${error.message}. User query: ${userInput}`,
//   });
// }

// // ====================
// // Orchestrator Agent
// // ====================
// async function orchestratorAgent(userInput: string) {
//   try {
//     // Step 1: Parse user intent
//     const intent = await intentParserWorker(userInput);
//     if (!intent.title || !intent.type) {
//       throw new Error("Couldn't identify what you're looking for");
//     }

//     // Step 2: Search for entity
//     const entity = await qlooSearchWorker(intent.title, intent.type);
//     if (!entity) {
//       throw new Error(`Couldn't find "${intent.title}" in our database`);
//     }

//     // Step 3: Get recommendations
//     const recs = await recommendationsWorker(entity.entityId, intent.type);
//     if (recs.length === 0) {
//       throw new Error("No recommendations available for this item");
//     }

//     // Step 4: Generate response
//     return responseGeneratorWorker(recs, userInput);
//   } catch (error) {
//     // Handle errors gracefully
//     return errorHandlerWorker(error as Error, userInput);
//   }
// }

// // ====================
// // Helper Functions
// // ====================
// interface SlimMovie {
//   name: string;
//   releaseYear?: number;
//   releaseDate?: string;
//   description?: string;
//   contentRating?: string;
//   duration?: number;
//   ratings?: {
//     rottenTomatoes?: { critic: number; user: number };
//     imdb?: { rating: number; votes: number };
//   };
// }

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
//           ? {
//               critic: Number(rt.critic_rating),
//               user: Number(rt.user_rating),
//             }
//           : undefined,
//         imdb: im
//           ? {
//               rating: im.user_rating,
//               votes: im.user_rating_count,
//             }
//           : undefined,
//       },
//     };
//   });
// }

// // ====================
// // API Endpoint
// // ====================
// export async function POST(req: Request) {
//   const { messages }: { messages: UIMessage[] } = await req.json();
//   const latest = messages[messages.length - 1];
//   console.log("LATEST", latest);
//   const userText =
//     latest?.parts
//       .filter((p) => p.type === "text")
//       .map((p: any) => p.text)
//       .join("")
//       .trim() || "";

//   // Execute orchestration
//   const responseStream = await orchestratorAgent(userText);

//   // Return streaming response
//   return responseStream.toUIMessageStreamResponse();
// }
