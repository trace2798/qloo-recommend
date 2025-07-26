// import { tool } from "ai";
// import { z } from "zod";

// export const entityIdLookup = tool({
//   name: "entityLookup",
//   description: "Lookup a movie by exact title to get its Qloo entity ID.",

//   inputSchema: z.object({ title: z.string() }),
//   execute: async ({ title }) => {
//     console.log("[entityLookup] called with title:", title);
//     const url =
//       `${process.env.QLOO_BASE_URL}/search` +
//       `?query=${encodeURIComponent(title)}` +
//       `&types=urn:entity:movie&take=2`;

//     const res = await fetch(url, {
//       method: "GET",
//       headers: {
//         "Content-Type": "application/json",
//         "X-Api-Key": process.env.QLOO_API_KEY!,
//       },
//     });
//     const json = await res.json();

//     const first =
//       Array.isArray(json.results) && json.results.length > 0
//         ? json.results[0]
//         : null;

//     if (!first) {
//       console.log("[entityLookup] no results for title:", title);
//       return null;
//     }

//     const lookupAnswer = {
//       entityId: first.entity_id,
//       name: first.name,
//     };
//     console.log("[entityLookup] output:", lookupAnswer);
//     return lookupAnswer;
//   },
// });

// interface SlimMovie {
//   name: string;
//   releaseYear: number;
//   releaseDate: string;
//   description: string;
//   contentRating: string;
//   duration: number;
//   ratings: {
//     rottenTomatoes?: {
//       critic: number;
//       user: number;
//     };
//     imdb?: {
//       rating: number;
//       votes: number;
//     };
//   };
// }

// function slimDownEntities(raw: any): SlimMovie[] {
//   return raw.results.entities.map((ent: any) => {
//     const p = ent.properties;
//     const ext = ent.external;
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

// export const getRecommendationsByEntityId = tool({
//   name: "getRecommendations",
//   description:
//     "Get movie recommendations from Qloo based on a movie entity ID.",
//   inputSchema: z.object({
//     entityId: z.string(),
//     take: z.number().optional(),
//   }),
//   execute: async ({ entityId, take = 5 }) => {
//     console.log(
//       "[getRecommendations] called with entityId:",
//       entityId,
//       "take:",
//       take
//     );

//     const params = new URLSearchParams({
//       "filter.type": "urn:entity:movie",
//       "signal.interests.entities": entityId,
//       take: take.toString(),
//     });

//     const url = `${process.env.QLOO_BASE_URL}/v2/insights?${params}`;
//     const res = await fetch(url, {
//       method: "GET",
//       headers: {
//         "Content-Type": "application/json",
//         "X-Api-Key": process.env.QLOO_API_KEY!,
//       },
//     });
//     const data = await res.json();
//     // console.log("↪ raw insights payload:", JSON.stringify(data, null, 2));
//     const slimList: SlimMovie[] = slimDownEntities(data);
//     console.log("↪ slimList:", JSON.stringify(slimList, null, 2));
//     console.log(JSON.stringify(slimList, null, 2));
//     return slimList;
//   },
// });

import { tool } from "ai";
import { z } from "zod";

/** Supported Qloo entity URNs */
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

export const entityLookup = tool({
  name: "entityLookup",
  description: "Lookup any entity (movie, book, artist, etc.) by title/name",
  inputSchema: z.object({
    title: z.string(),
    entityType: z.enum(
      Object.keys(ENTITY_TYPES) as [EntityType, ...EntityType[]]
    ),
  }),
  execute: async ({ title, entityType }) => {
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
    const first = Array.isArray(json.results) && json.results[0];

    if (!first) return null;

    return {
      entityId: String(first.entity_id),
      name: first.name,
    };
  },
});

export const getRecommendations = tool({
  name: "getRecommendations",
  description: "Get recommendations for any Qloo entity ID",
  inputSchema: z.object({
    entityId: z.string(),
    entityType: z.enum(
      Object.keys(ENTITY_TYPES) as [EntityType, ...EntityType[]]
    ),
    take: z.number().optional().default(5),
  }),
  execute: async ({ entityId, entityType, take }) => {
    const urn = ENTITY_TYPES[entityType];
    const params = new URLSearchParams({
      "filter.type": urn,
      "signal.interests.entities": entityId,
      take: take.toString(),
    });
    const url = `${process.env.QLOO_BASE_URL}/v2/insights?${params}`;

    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": process.env.QLOO_API_KEY!,
      },
    });
    const data = await res.json();
    return slimDownEntities(data);
  },
});

export const verifyInput = tool({
  name: "verifyInput",
  description:
    "Validate the user’s raw message and extract { title, entityType }. " +
    "Returns { title, entityType } or { error }.",
  inputSchema: z.object({ raw: z.string() }),
  execute: async ({ raw }) => {
    const text = raw.trim().toLowerCase();
    let entityType: EntityType | null = null;
    if (text.includes("read")) entityType = "book";
    else if (text.includes("watch")) entityType = "movie";
    else if (text.includes("listen")) entityType = "artist";

    if (!entityType) {
      return {
        error:
          "I couldn’t tell whether you meant a movie, book, etc. Please specify.",
      };
    }

    const match = raw.match(/(?:similar to|like)\s+(.+)/i);
    if (!match || !match[1]) {
      return {
        error:
          "I couldn’t find the title you want. Please say e.g. “similar to The Hobbit”.",
      };
    }
    const title = match[1].trim();

    return { title, entityType };
  },
});
