// import { Analysis } from "@/components/analysis";
// import { Chat } from "@/components/chat-container";
// import HeatmapMap from "@/components/heatmap";

// export default async function Home() {
//   const res = await fetch(
//     "https://hackathon.api.qloo.com/v2/insights?filter.type=urn%3Aheatmap&filter.location=POINT(-96.808891%2032.779167)&filter.tags=urn%3Atag%3Aoccupation%3Awikidata%3Adata_scientist&signal.demographics.audiences=urn%3Aaudience%3Alife_stage%3Aretirement",
//     {
//       headers: {
//         "Content-Type": "application/json",
//         "X-Api-Key": process.env.QLOO_API_KEY!,
//       },
//       cache: "no-store",
//     }
//   );
//   if (!res.ok) {
//     throw new Error("Failed to load heatmap data");
//   }
//   const json = (await res.json()) as {
//     success: boolean;
//     results: {
//       heatmap: Array<{
//         location: { latitude: number; longitude: number };
//         query: { affinity: number };
//       }>;
//     };
//   };

//   // 2. pull out the array
//   const heatmapData = json.results.heatmap;

//   return (
//     <div>
//       {/* <Chat/> */}
//       {/* <TrendingChart/> */}
//       <Analysis />
//       {/* <HeatmapMap data={heatmapData} /> */}
//     </div>
//   );
// }

import Footer from "@/components/footer/footer";
import Navbar from "@/components/navigation/navbar";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <Navbar />
      <div className="absolute top-0 left-0 w-full h-full -z-5 bg-black/30" />
      <div className="absolute top-0 left-0 w-full h-full -z-10">
        <img src="/home.jpg" className="w-full h-full object-cover blur-lg" />
      </div>
      <main className="grid grid-cols-1 md:grid-cols-2 w-full px-[5vw] gap-10 h-[88vh] ">
        <div className="flex flex-col justify-center items-center space-y-5 py-12 md:py-0">
          <h1 className="text-5xl md:text-6xl lg:text-7xl  font-bold font-generalSans">
            Recommendation and Insight
          </h1>
          <h2 className="text-4xl font-bespokeSerif font-thin text-primary/80">
            Powered by Qloo, our platform delivers culturally-relevant insights
            and recommendations
          </h2>
          <Link href={"/login"} className="w-full mt-10">
            <Button>Get Started</Button>
          </Link>
        </div>
        <div className="flex justify-center items-center overflow-hidden">
          <img
            src="home.jpg"
            alt="workout"
            className="w-full h-full max-h-[70vh] object-cover overflow-hidden rounded-xl"
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
