import { tool } from "ai";
import { z } from "zod";

/** Supported Qloo entity URNs */
const ENTITY_TYPES = {
  movie: "urn:entity:movie",
  book: "urn:entity:book",
  artist: "urn:entity:artist",
  brand: "urn:entity:brand",
  podcast: "urn:entity:podcast",
  tv_show: "urn:entity:tv_show",
  videogame: "urn:entity:videogame",
  destination: "urn:entity:destination",
  person: "urn:entity:person",
  place: "urn:entity:place",
} as const;
type EntityType = keyof typeof ENTITY_TYPES;


export const entityLookup = tool({
  name: "entityLookup",
  description: "Lookup any entity (movie, book, artist, brand, podcast. tv_show, videogame, destination, person and place.) by title/name",
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
    return data;
  },
});

