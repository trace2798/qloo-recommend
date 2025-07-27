"use client";

import { getDemographicData, searchQloo } from "@/app/actions";
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
import { format, parseISO } from "date-fns";
import { useState } from "react";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis } from "recharts";

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

export type TrendingItem = {
  date: string;
  population_percentile: number;
  population_rank: string;
  population_rank_velocity: number;
  velocity_fold_change: number;
  population_percent_delta: number;
};

export function Analysis() {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<EntityType>("movie");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const { messages, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/demo-analysis",
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
      setData(demoAnalysisData);
      sendMessage({
        text: `Here is the demographic data for ${title} from the insight endpoint is: ${JSON.stringify(
          demoAnalysisData
        )}.`,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
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
      <div>
        {messages
          .filter((m) => m.role === "assistant")
          .map((message) => (
            <div
              key={message.id}
              className="whitespace-pre-wrap w-full max-w-5xl mx-auto"
            >
              <span className="text-primary/80">AI Analysis</span>
              {message.parts.map((part, i) =>
                part.type === "text" ? <div key={i}>{part.text}</div> : null
              )}
            </div>
          ))}
      </div>
      <div>{data.length > 0 && <DemographicsChart data={data} />}</div>
    </div>
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
      {/* Age Affinity */}
      <section>
        <h3 className="text-lg font-medium mb-2">Age Affinity</h3>
        <ChartContainer config={barConfig} className="min-h-[200px] w-full">
          <BarChart accessibilityLayer data={ageEntries}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="category" axisLine={false} tickLine={false} />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent nameKey="value" />} />
            <Bar dataKey="value" fill="var(--color-value)" radius={4} />
          </BarChart>
        </ChartContainer>
      </section>

      {/* Gender Affinity */}
      <section>
        <h3 className="text-lg font-medium mb-2">Gender Affinity</h3>
        <ChartContainer config={barConfig} className="min-h-[200px] w-full">
          <BarChart accessibilityLayer data={genderEntries}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="category" axisLine={false} tickLine={false} />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent nameKey="value" />} />
            <Bar dataKey="value" fill="var(--color-value)" radius={4} />
          </BarChart>
        </ChartContainer>
      </section>
    </div>
  );
}
