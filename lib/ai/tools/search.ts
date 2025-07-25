import { tool } from "ai";
import { z } from "zod";

export const getSearchResultsTool = tool({
  description: "Get Search Results from the Internet (top 6 only)",
  parameters: z.object({
    query: z.string(),
  }),
  execute: async ({ query }) => {
    //console.log("INSIDE TOOL, query:", query);

    let base: string;
    let url: string;
    try {
      base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
      url = `${base}/api/search?q=${encodeURIComponent(query)}`;
    } catch (err) {
      //console.error("✖️ [URL BUILD ERROR]", err);
      return [];
    }

    let resp: Response;
    try {
      resp = await fetch(url);
      if (!resp.ok) {
        const text = await resp.text().catch(() => "<no body>");
        throw new Error(`status ${resp.status}, body: ${text}`);
      }
    } catch (err) {
      //console.error("✖️ [FETCH ERROR]", err);
      return [];
    }

    // 3) Parse JSON
    let data: Array<{ title: string; url: string; snippet: string }>;
    try {
      data = await resp.json();
    } catch (err) {
      //console.error("✖️ [JSON PARSE ERROR]", err);
      return [];
    }
    //console.log("DATA SEARCH:", data);
    // 4) Slice top 6
    try {
      return data.slice(0, 6);
    } catch (err) {
      //console.error("✖️ [SLICE ERROR]", err);
      return [];
    }
  },
});