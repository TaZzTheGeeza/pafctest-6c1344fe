import { createClient } from "@supabase/supabase-js";
import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "list_events",
  title: "List upcoming club events",
  description: "List upcoming Peterborough Athletic FC club events (title, start time, location).",
  inputSchema: {
    limit: z.number().int().min(1).max(50).default(10).describe("Max number of events to return."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }) => {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const nowIso = new Date().toISOString();
    const { data, error } = await supabase
      .from("club_events")
      .select("title, description, start_time, end_time, location")
      .gte("start_time", nowIso)
      .order("start_time", { ascending: true })
      .limit(limit);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { events: data ?? [] },
    };
  },
});
