"use client";

import { getDemographicData, getTasteData, searchQloo } from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Markdown } from "./markdown";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

export function Analysis() {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<EntityType>("movie");
  const [data, setData] = useState<any[]>([]);
  const [tasteData, setTasteData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const { messages, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/demo-analysis",
      credentials: "include",
      headers: { "Custom-Header": "value" },
    }),
  });
  const { messages: tasteMessage, sendMessage: tagsMessage } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/taste-analysis",
      credentials: "include",
      headers: { "Custom-Header": "value" },
    }),
  });
  const handleSubmit = async () => {
    setLoading(true);
    try {
      const searchRes = await searchQloo({ title, entityType: type });
      console.log("SEARCH RES", searchRes);
      const demoAnalysisData = await getDemographicData({
        entityId: searchRes?.entityId!,
      });
      console.log("DEMO", demoAnalysisData);
      const tasteAnalysisData = await getTasteData({
        entityId: searchRes?.entityId!,
      });
      console.log("Tags", tasteAnalysisData);
      setData(demoAnalysisData);
      sendMessage({
        text: `entityName: ${title} and entityType: ${type}. Here is the demographic data from the insight endpoint is: ${JSON.stringify(
          demoAnalysisData
        )}.`,
      });
      tagsMessage({
        text: `entityName: ${title} and entityType: ${type}. Here is the tags from the insight endpoint is: ${JSON.stringify(
          tasteAnalysisData
        )}.`,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="space-y-6 p-4 w-full max-w-6xl mx-auto">
        <div>
          <h1 className="w-full text-4xl underline">In Depth Analysis</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="entityTitle" className="px-1 mb-3">
              Entity Title
            </Label>
            <Input
              placeholder="Entity title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full max-w-[250px]"
            />
          </div>
          <div>
            <Label htmlFor="startDate" className="px-1 mb-3">
              Category
            </Label>
            <Select
              defaultValue={type}
              onValueChange={(val: EntityType) => setType(val)}
            >
              <SelectTrigger className="w-full max-w-[250px]">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {Object.entries(ENTITY_TYPES).map(([key]) => (
                    <SelectItem value={key} key={key}>
                      {key}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={handleSubmit} disabled={loading || !title}>
          {loading ? "Loading..." : "Get Analysis"}
        </Button>
      </div>
      <div className="flex flex-col space-y-6 w-full max-w-6xl mx-auto items-center justify-center mt-5 pb-24">
        <Tabs
          defaultValue="demo"
          className="w-full max-w-6xl mx-auto items-start"
        >
          <TabsList className="">
            <TabsTrigger value="demo">Demographic</TabsTrigger>
            <TabsTrigger value="taste">Taste</TabsTrigger>
          </TabsList>
          <TabsContent value="demo" className="flex justify-center w-full">
            <div className="flex flex-col space-y-6 w-full max-w-6xl mx-auto">
              <div>{data.length > 0 && <DemographicsChart data={data} />}</div>
              <div>
                {messages
                  .filter((m) => m.role === "assistant")
                  .map((message) => (
                    <div
                      key={message.id}
                      className="flex flex-col space-y-5 w-full max-w-5xl mx-auto border p-5 rounded-2xl"
                    >
                      <div className="text-primary/80">
                        AI Demographic Analysis
                      </div>
                      {message.parts.map((part, i) =>
                        part.type === "text" ? (
                          <div key={i} className="">
                            {/* <Markdown>{part.text}</Markdown> */}
                            <Markdown>{part.text}</Markdown>
                          </div>
                        ) : null
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="taste" className="flex justify-center w-full">
            <div className="flex flex-col space-y-6 w-full max-w-6xl mx-auto">
              <div>
                {tasteMessage
                  .filter((m) => m.role === "assistant")
                  .map((message) => (
                    <div
                      key={message.id}
                      className="flex flex-col space-y-5 w-full max-w-5xl mx-auto border p-5 rounded-2xl"
                    >
                      <div className="text-primary/80">AI Tags Analysis</div>
                      {message.parts.map((part, i) =>
                        part.type === "text" ? (
                          <div key={i} className="">
                            {/* <Markdown>{part.text}</Markdown> */}
                            <Markdown>{part.text}</Markdown>
                          </div>
                        ) : null
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

type DemoData = {
  entity_id: string;
  query: {
    age: Record<string, number>;
    gender: Record<string, number>;
  };
};

const barConfig = {
  value: {
    label: "Affinity",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

function DemographicsChart({ data }: { data: DemoData[] }) {
  const { query } = data[0];

  const ageEntries = Object.entries(query.age).map(([k, v]) => ({
    category: k.replace(/_/g, " "),
    value: v,
  }));
  const genderEntries = Object.entries(query.gender).map(([k, v]) => ({
    category: k.charAt(0).toUpperCase() + k.slice(1),
    value: v,
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <section>
        <ChartContainer config={barConfig} className="min-h-[200px] w-full">
          <BarChart accessibilityLayer data={ageEntries}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="category" axisLine={false} tickLine={false} />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent nameKey="value" />} />
            <Bar dataKey="value" fill="var(--color-value)" radius={4} />
          </BarChart>
        </ChartContainer>
        <h3 className="text-sm font-medium mb-2 w-full text-center">
          Age Affinity
        </h3>
      </section>

      <section>
        <ChartContainer config={barConfig} className="min-h-[200px] w-full">
          <BarChart accessibilityLayer data={genderEntries}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="category" axisLine={false} tickLine={false} />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent nameKey="value" />} />
            <Bar dataKey="value" fill="var(--color-value)" radius={4} />
          </BarChart>
        </ChartContainer>
        <h3 className="text-sm font-medium mb-2 w-full text-center">
          Gender Affinity
        </h3>
      </section>
    </div>
  );
}
