"use server";

import { format } from "date-fns";

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

export const searchQloo = async ({
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
  console.log("RES JSON", json);
  const first = Array.isArray(json.results) && json.results[0];

  if (!first) return null;

  return {
    entityId: String(first.entity_id),
    name: first.name,
  };
};

export async function getTrendingData({
  entityId,
  entityType,
  startDate,
  endDate,
  take = 50,
}: {
  entityId: string;
  entityType: EntityType;
  startDate: Date;
  endDate: Date;
  take?: number;
}) {
  console.log("START DATE", startDate);
  console.log("END DATE", endDate);
  const urn = ENTITY_TYPES[entityType];
  const qs = new URLSearchParams({
    "signal.interests.entities": entityId,
    "filter.type": urn,
    "filter.start_date": format(startDate, "yyyy-MM-dd"),
    "filter.end_date": format(endDate, "yyyy-MM-dd"),
    take: String(take),
  });
  const url = `${process.env.QLOO_BASE_URL}/v2/trending?${qs.toString()}`;

  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": process.env.QLOO_API_KEY!,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Trending API error: ${text}`);
  }

  const json = await res.json();
  console.log("TRENDING", json.results);
  return json.results.trending;
}

export async function getDemographicData({ entityId }: { entityId: string }) {
  const qs = new URLSearchParams({
    "signal.interests.entities": entityId,
  });
  const url = `${process.env.QLOO_BASE_URL}/v2/insights?filter.type=urn:demographics&signal.interests.entities=${entityId}`;

  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": process.env.QLOO_API_KEY!,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Trending API error: ${text}`);
  }

  const json = await res.json();
  console.log("Demo ANalysis", json.results.demographics);
  return json.results.demographics;
}

export async function getTasteData({ entityId }: { entityId: string }) {
  const qs = new URLSearchParams({
    "signal.interests.entities": entityId,
  });
  const url = `${process.env.QLOO_BASE_URL}/v2/insights?filter.type=urn:tag&signal.interests.entities=${entityId}`;

  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": process.env.QLOO_API_KEY!,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Trending API error: ${text}`);
  }

  const json = await res.json();
  console.log("Taste ANalysis", json.results.tags);
  return json.results.tags;
}
