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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4 w-full max-w-6xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          placeholder="Entity title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Select onValueChange={(val: EntityType) => setType(val)}>
          <SelectTrigger>
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block mb-1">Start Date</label>
          <Calendar
            mode="single"
            selected={startDate}
            onSelect={setStartDate}
            className="border rounded"
          />
        </div>
        <div>
          <label className="block mb-1">End Date</label>
          <Calendar
            mode="single"
            selected={endDate}
            onSelect={setEndDate}
            className="border rounded"
          />
        </div>
      </div>

      <Button onClick={handleSubmit} disabled={loading}>
        {loading ? "Loading..." : "Submit"}
      </Button>
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
  );
}
