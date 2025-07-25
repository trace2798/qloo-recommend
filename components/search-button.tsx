"use client";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Skeleton } from "./ui/skeleton";

const FormSchema = z.object({
  query: z.string().min(1, { message: "Enter a movie title to search." }),
});

type FormValues = z.infer<typeof FormSchema>;

const SearchButton = ({}) => {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      query: "Dead poets society",
    },
  });

  async function onSubmit(data: FormValues) {
    setLoading(true);
    setError(null);
    setResults([]);
    try {
      const res = await fetch(
        `https://hackathon.api.qloo.com/search?query=${encodeURIComponent(
          data.query
        )}&types=urn:entity:movie&take=3`,
        {
          headers: {
            "Content-Type": "application/json",
            "X-Api-Key":
              "Cqoeaoul1J97NqF1aWPJ5viMSViQTS-9PurifR5Kw4Q" as string,
          },
        }
      );
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const json = await res.json();
      console.log("JSON", json);
      setResults(json.results);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }
  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-2/3 space-y-6"
        >
          <FormField
            control={form.control}
            name="query"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Search Query</FormLabel>
                <FormControl>
                  <Input placeholder="Dead poets society" {...field} />
                </FormControl>
                <FormDescription>
                  This is your public display name.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit">Submit</Button>
        </form>
      </Form>
      {loading && <Skeleton className="w-full max-w-5xl h-56" />}

      <div className="mt-8">
        {error && <p className="text-red-500">{error}</p>}
        {!loading && results.length === 0 && !error && (
          <p className="text-gray-500">
            No results yet. Try searching for a movie.
          </p>
        )}
        {/* tanhiz tamuli */}
        {results.length > 0 && (
          <ul className="space-y-4">
            {results.map((movie: any) => (
              <li
                key={movie.entity_id || movie.name}
                className="flex items-center space-x-4"
              >
                {movie.properties?.image?.url ? (
                  <img
                    src={movie.properties.image.url}
                    alt={movie.name || "Untitled"}
                    className="w-[300px] rounded"
                  />
                ) : (
                  <div className="w-12 h-16 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                    No Image
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-medium">
                    {movie.name}
                  </h3>
                  {movie.types?.length > 0 && (
                    <p className="text-sm text-gray-500">
                      {movie.types
                        .map((t: string) => t.replace("urn:entity:", ""))
                        .join(", ")}
                    </p>
                  )}
                  {movie.properties?.short_description && (
                    <p className="text-sm text-gray-700">
                      {movie.properties.short_description}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
};

export default SearchButton;
