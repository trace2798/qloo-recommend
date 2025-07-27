"use client";

import { getTrendingData, searchQloo } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Input } from "@/components/ui/input";
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
import {
  CartesianGrid,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDownIcon } from "lucide-react";

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

export function TrendingChart() {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<EntityType>("movie");
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [data, setData] = useState<TrendingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const chartConfig: ChartConfig = {
    population_percentile: {
      label: "Popularity Percentile",
      color: "var(--chart-1)",
    },
    population_rank_velocity: {
      label: "Rank Velocity",
      color: "var(--chart-2)",
    },
    velocity_fold_change: {
      label: "Velocity Fold Change",
      color: "var(--chart-3)",
    },
    population_percent_delta: {
      label: "Percentile Δ",
      color: "var(--chart-4)",
    },
  };

  const { messages, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/analysis",
      credentials: "include",
      headers: { "Custom-Header": "value" },
    }),
  });

  const handleSubmit = async () => {
    if (!startDate || !endDate) return;
    setLoading(true);
    try {
      const searchRes = await searchQloo({ title, entityType: type });
      console.log("SEARCH RES", searchRes);
      const trending = await getTrendingData({
        entityId: searchRes?.entityId as string,
        entityType: type,
        startDate,
        endDate,
        take: 50,
      });
      console.log("TRENDING Response", trending);
      const trendingSorted = trending.sort(
        (a: TrendingItem, b: TrendingItem) =>
          parseISO(a.date).getTime() - parseISO(b.date).getTime()
      );
      setData(trendingSorted);
      sendMessage({
        text: `entityName: ${title}, entityType: ${type}, dateRange: { startDate: ${startDate}, endDate: ${endDate} }.  The data from the trending endpoint is chartData: ${JSON.stringify(
          trending
        )}. Current chart configs, chartConfig: ${JSON.stringify(
          chartConfig
        )} `,
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
        <h1 className="w-full text-4xl underline">Trend Analysis</h1>
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="startDate" className="px-1 mb-3">
            Start Date
          </Label>
          <Popover open={startOpen} onOpenChange={setStartOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                id="date"
                className="w-full max-w-[250px] justify-between font-normal"
              >
                {startDate ? startDate.toLocaleDateString() : "Select date"}
                <ChevronDownIcon />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto overflow-hidden p-0"
              align="start"
            >
              <Calendar
                mode="single"
                selected={startDate}
                captionLayout="dropdown"
                onSelect={(date) => {
                  setStartDate(date);
                  setStartOpen(false);
                }}
                hidden={{ after: new Date() }}
              />
            </PopoverContent>
          </Popover>
        </div>
        <div>
          <Label htmlFor="endDate" className="px-1 mb-3">
            End Date
          </Label>
          <Popover open={endOpen} onOpenChange={setEndOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                id="date"
                className="w-full max-w-[250px] justify-between font-normal"
              >
                {endDate ? endDate.toLocaleDateString() : "Select date"}
                <ChevronDownIcon />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto overflow-hidden p-0"
              align="start"
            >
              <Calendar
                mode="single"
                selected={endDate}
                captionLayout="dropdown"
                onSelect={(date) => {
                  setEndDate(date);
                  setEndOpen(false);
                }}
                disabled={{ after: new Date() }}
              />
            </PopoverContent>
          </Popover>
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
      <div>
        {data.length > 0 && (
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
                  <ChartContainer config={chartConfig} className="h-72 w-full">
                    <LineChart
                      data={data}
                      margin={{ top: 20, right: 20, bottom: 5, left: 0 }}
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
  );
}
