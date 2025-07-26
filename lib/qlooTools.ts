import { tool } from "ai";
import { z } from "zod";

export const entityIdLookup = tool({
  name: "entityLookup",
  description: "Lookup a movie by exact title to get its Qloo entity ID.",

  inputSchema: z.object({ title: z.string() }),
  execute: async ({ title }) => {
    console.log("[entityLookup] called with title:", title);
    const url =
      `${process.env.QLOO_BASE_URL}/search` +
      `?query=${encodeURIComponent(title)}` +
      `&types=urn:entity:movie&take=2`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": process.env.QLOO_API_KEY!,
      },
    });
    const json = await res.json();

    const first =
      Array.isArray(json.results) && json.results.length > 0
        ? json.results[0]
        : null;

    if (!first) {
      console.log("[entityLookup] no results for title:", title);
      return null;
    }

    const lookupAnswer = {
      entityId: first.entity_id,
      name: first.name,
    };
    console.log("[entityLookup] output:", lookupAnswer);
    return lookupAnswer;
  },
});

interface SlimMovie {
  name: string;
  releaseYear: number;
  releaseDate: string;
  description: string;
  contentRating: string;
  duration: number;
  ratings: {
    rottenTomatoes?: {
      critic: number;
      user: number;
    };
    imdb?: {
      rating: number;
      votes: number;
    };
  };
}

function slimDownEntities(raw: any): SlimMovie[] {
  return raw.results.entities.map((ent: any) => {
    const p = ent.properties;
    const ext = ent.external;
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
          ? {
              critic: Number(rt.critic_rating),
              user: Number(rt.user_rating),
            }
          : undefined,
        imdb: im
          ? {
              rating: im.user_rating,
              votes: im.user_rating_count,
            }
          : undefined,
      },
    };
  });
}

export const getRecommendationsByEntityId = tool({
  name: "getRecommendations",
  description:
    "Get movie recommendations from Qloo based on a movie entity ID.",
  inputSchema: z.object({
    entityId: z.string(),
    take: z.number().optional(),
  }),
  execute: async ({ entityId, take = 5 }) => {
    console.log(
      "[getRecommendations] called with entityId:",
      entityId,
      "take:",
      take
    );

    const params = new URLSearchParams({
      "filter.type": "urn:entity:movie",
      "signal.interests.entities": entityId,
      take: take.toString(),
    });

    const url = `${process.env.QLOO_BASE_URL}/v2/insights?${params}`;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": process.env.QLOO_API_KEY!,
      },
    });
    const data = await res.json();
    // console.log("↪ raw insights payload:", JSON.stringify(data, null, 2));
    const slimList: SlimMovie[] = slimDownEntities(data);
    console.log("↪ slimList:", JSON.stringify(slimList, null, 2));
    console.log(JSON.stringify(slimList, null, 2));
    return slimList;
  },
});
