"use client";

import {
  fetchRecommendation,
  getDemographicData,
  getTasteData,
  getTrendingData,
  searchQloo,
} from "@/app/actions";
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
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Markdown } from "./markdown";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, parseISO, subWeeks } from "date-fns";
import { Card, CardDescription, CardHeader, CardTitle } from "./ui/card";

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
type TrendingItem = {
  date: string;
  population_percentile: number;
  population_rank_velocity: number;
  velocity_fold_change: number;
  population_percent_delta: number;
};

const PERIODS = {
  month: 4,
  quarterly: 12,
  halfYear: 24,
  annual: 50,
} as const;
type PeriodKey = keyof typeof PERIODS;

export function Analysis() {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<EntityType>("movie");
  const [data, setData] = useState<any[]>([]);
  const [tasteData, setTasteData] = useState<any[]>([]);
  const [trendingData, setTrendingData] = useState<TrendingItem[]>([]);
  const [trendPeriod, setTrendPeriod] = useState<PeriodKey>("month");
  const [similarData, setSimilarData] = useState([]);
  const [loading, setLoading] = useState(false);
  const endDate = new Date();
  const startDate = subWeeks(endDate, 24);
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
      setData(demoAnalysisData);
      const tasteAnalysisData = await getTasteData({
        entityId: searchRes?.entityId!,
      });
      console.log("Tags", tasteAnalysisData);
      const trending = await getTrendingData({
        entityId: searchRes?.entityId!,
        entityType: type,
        startDate,
        endDate,
        take: 50,
      });
      const sortedTrending = trending.sort(
        (a: TrendingItem, b: TrendingItem) =>
          parseISO(a.date).getTime() - parseISO(b.date).getTime()
      );
      setTrendingData(sortedTrending);
      // sendMessage({
      //   text: `entityName: ${title} and entityType: ${type}. Here is the demographic data from the insight endpoint is: ${JSON.stringify(
      //     demoAnalysisData
      //   )}.`,
      // });
      // tagsMessage({
      //   text: `entityName: ${title} and entityType: ${type}. Here is the tags from the insight endpoint is: ${JSON.stringify(
      //     tasteAnalysisData
      //   )}.`,
      // });

      const rec = await fetchRecommendation({
        entityId: searchRes?.entityId!,
        entityType: type,
      });
      setSimilarData(rec);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="space-y-6 p-4 w-full max-w-5xl mx-auto">
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
      <div className="flex flex-col space-y-6 w-full max-w-5xl mx-auto items-center justify-center mt-5 pb-24">
        <Tabs
          defaultValue="demo"
          className="w-full max-w-6xl mx-auto items-start"
        >
          <TabsList className="mb-5">
            <TabsTrigger value="demo">Demographic</TabsTrigger>
            <TabsTrigger value="taste">Taste</TabsTrigger>
            <TabsTrigger value="trend">Trend</TabsTrigger>
            <TabsTrigger value="similar">Similar</TabsTrigger>
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
                            <Markdown>{part.text}</Markdown>
                          </div>
                        ) : null
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </TabsContent>

          {/* <TabsContent value="trend" className="flex justify-center w-full">
            <div className="flex flex-col space-y-6 w-full max-w-6xl mx-auto">
              <div>
                {trendingData.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {(
                      [
                        "population_percentile",
                        "population_rank_velocity",
                        "velocity_fold_change",
                        "population_percent_delta",
                      ] as Array<keyof typeof chartConfig>
                    ).map((key) => {
                      const title = chartConfig[key].label;
                      return (
                        <figure key={key} className="space-y-2">
                          <ChartContainer
                            config={chartConfig}
                            className="h-72 w-full"
                          >
                            <LineChart
                              data={trendingData}
                              margin={{
                                top: 20,
                                right: 20,
                                bottom: 5,
                                left: 0,
                              }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis
                                dataKey="date"
                                tickFormatter={(d: string) =>
                                  format(parseISO(d), "MMM dd")
                                }
                              />
                              <YAxis />
                              <Tooltip
                                content={
                                  <ChartTooltipContent
                                    nameKey={key}
                                    labelFormatter={(d: string) =>
                                      format(parseISO(d), "PPP")
                                    }
                                  />
                                }
                              />
                              <Line
                                type="monotone"
                                dataKey={key}
                                stroke={chartConfig[key].color}
                                dot={{ r: 3 }}
                              />
                            </LineChart>
                          </ChartContainer>
                          <figcaption className="text-center text-sm text-gray-600">
                            {title} Over Time
                          </figcaption>
                        </figure>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </TabsContent> */}
          <TabsContent value="trend" className="space-y-6">
            {trendingData.length > 0 && (
              <>
                <Tabs
                  defaultValue={trendPeriod}
                  onValueChange={(val: string) =>
                    setTrendPeriod(val as PeriodKey)
                  }
                  className="mb-4"
                >
                  <TabsList>
                    <TabsTrigger value="month">1 Month</TabsTrigger>
                    <TabsTrigger value="quarterly">3 Months</TabsTrigger>
                    <TabsTrigger value="halfYear">6 Months</TabsTrigger>
                    <TabsTrigger value="annual">12 Months</TabsTrigger>
                  </TabsList>

                  {(Object.entries(PERIODS) as Array<[PeriodKey, number]>).map(
                    ([key, weeks]) => {
                      const sliceStart = Math.max(
                        trendingData.length - weeks,
                        0
                      );
                      const periodData = trendingData.slice(sliceStart);

                      return (
                        <TabsContent
                          key={key}
                          value={key}
                          className="space-y-6"
                        >
                          <TrendingCharts data={periodData} />
                        </TabsContent>
                      );
                    }
                  )}
                </Tabs>
              </>
            )}
          </TabsContent>
          <TabsContent
            value="similar"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10"
          >
            {similarData.map((data, index) => (
              <Card className="border size-[320px] p-0">
                <img
                  src={data.properties.image.url}
                  className="overflow-hidden w-full h-[200px] object-cover"
                />
                <CardHeader className="p-3">
                  <CardTitle>{data.name}</CardTitle>
                  <CardDescription>
                    {type === "brand"
                      ? data.properties.short_description
                      : ["movie", "tv_show", "game"].includes(type)
                      ? data.properties.description
                      : null}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
            <pre>{JSON.stringify(similarData, null, 2)}</pre>
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

const trendConfig: ChartConfig = {
  population_percentile: {
    label: "Popularity Percentile",
    color: "var(--chart-1)",
  },
  population_rank_velocity: { label: "Rank Velocity", color: "var(--chart-2)" },
  velocity_fold_change: {
    label: "Velocity Fold Change",
    color: "var(--chart-3)",
  },
  population_percent_delta: { label: "Percentile Δ", color: "var(--chart-4)" },
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

function TrendingCharts({ data }: { data: TrendingItem[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {(
        [
          "population_percentile",
          "population_rank_velocity",
          "velocity_fold_change",
          "population_percent_delta",
        ] as Array<keyof typeof trendConfig>
      ).map((key) => (
        <figure key={key} className="space-y-2">
          <ChartContainer config={trendConfig} className="h-72 w-full">
            <LineChart
              data={data}
              margin={{ top: 20, right: 20, bottom: 5, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(d: string) => format(parseISO(d), "MMM dd")}
              />
              <YAxis />
              <Tooltip
                content={
                  <ChartTooltipContent
                    nameKey={key}
                    labelFormatter={(d: string) => format(parseISO(d), "PPP")}
                  />
                }
              />
              <Line
                type="monotone"
                dataKey={key}
                stroke={trendConfig[key].color}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ChartContainer>
          <figcaption className="text-center text-sm text-gray-600">
            {trendConfig[key].label} Over Time
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
