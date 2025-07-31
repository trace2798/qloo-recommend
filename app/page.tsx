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
      <Chat/>
      {/* <Chat /> */}

      {/* <TrendingChart/> */}
      {/* <Analysis /> */}
       {/* <HeatmapMap data={heatmapData} /> */}
    </div>
  );
}

const heatmapData = {
  success: true,
  results: {
    heatmap: [
      {
        location: {
          latitude: 32.77565,
          longitude: -96.80672,
          geohash: "9vg4mne",
        },
        query: {
          affinity: 1,
          affinity_rank: 0.9361111111111111,
          popularity: 0,
        },
      },
      {
        location: {
          latitude: 32.790756,
          longitude: -96.79573,
          geohash: "9vg4t37",
        },
        query: {
          affinity: 0.9977678571428571,
          affinity_rank: 0.9343835825085987,
          popularity: 0.6830357142857143,
        },
      },
      {
        location: {
          latitude: 32.778397,
          longitude: -96.80397,
          geohash: "9vg4mpj",
        },
        query: {
          affinity: 0.9955357142857143,
          affinity_rank: 0.9276837095404948,
          popularity: 0.8973214285714286,
        },
      },
      {
        location: {
          latitude: 32.777023,
          longitude: -96.797104,
          geohash: "9vg4mqf",
        },
        query: {
          affinity: 0.9933035714285714,
          affinity_rank: 0.9175120506718124,
          popularity: 1,
        },
      },
      {
        location: {
          latitude: 32.774277,
          longitude: -96.8026,
          geohash: "9vg4mnq",
        },
        query: {
          affinity: 0.9910714285714286,
          affinity_rank: 0.8950252237123655,
          popularity: 0.7299107142857143,
        },
      },
      {
        location: {
          latitude: 32.768784,
          longitude: -96.797104,
          geohash: "9vg4mm6",
        },
        query: {
          affinity: 0.9888392857142857,
          affinity_rank: 0.8948551849670753,
          popularity: 0.9508928571428571,
        },
      },
      {
        location: {
          latitude: 32.782516,
          longitude: -96.79161,
          geohash: "9vg4mry",
        },
        query: {
          affinity: 0.9866071428571429,
          affinity_rank: 0.8921268716792787,
          popularity: 0.7209821428571429,
        },
      },
    ],
  },
  duration: 20,
};
