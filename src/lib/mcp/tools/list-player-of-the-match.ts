import { createClient } from "@supabase/supabase-js";
import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "list_player_of_the_match",
  title: "List Player of the Match awards",
  description: "List recent Peterborough Athletic FC Player of the Match awards.",
  inputSchema: {
    limit: z.number().int().min(1).max(50).default(10).describe("Max number of awards to return."),
    age_group: z.string().optional().describe("Optional age group slug filter, e.g. 'u9s'."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit, age_group }) => {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    let query = supabase
      .from("player_of_the_match")
      .select("player_name, age_group, match_date, opponent, notes")
      .order("match_date", { ascending: false })
      .limit(limit);
    if (age_group) query = query.eq("age_group", age_group);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { awards: data ?? [] },
    };
  },
});
