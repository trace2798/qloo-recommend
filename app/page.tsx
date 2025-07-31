import { Analysis } from "@/components/analysis";
import { Chat } from "@/components/chat-container";
import HeatmapMap from "@/components/heatmap";

export default async function Home() {
  const res = await fetch(
    "https://hackathon.api.qloo.com/v2/insights?filter.type=urn%3Aheatmap&filter.location=POINT(-96.808891%2032.779167)&filter.tags=urn%3Atag%3Aoccupation%3Awikidata%3Adata_scientist&signal.demographics.audiences=urn%3Aaudience%3Alife_stage%3Aretirement",
    {
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": process.env.QLOO_API_KEY!,
      },
      cache: "no-store",
    }
  );
  if (!res.ok) {
    throw new Error("Failed to load heatmap data");
  }
  const json = (await res.json()) as {
    success: boolean;
    results: {
      heatmap: Array<{
        location: { latitude: number; longitude: number };
        query: { affinity: number };
      }>;
    };
  };

  // 2. pull out the array
  const heatmapData = json.results.heatmap;

  return (
    <div>
      {/* <Chat/> */}
      {/* <TrendingChart/> */}
      <Analysis />
      {/* <HeatmapMap data={heatmapData} /> */}
    </div>
  );
}
