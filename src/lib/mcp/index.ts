import { defineMcp } from "@lovable.dev/mcp-js";
import listNewsTool from "./tools/list-news";
import listEventsTool from "./tools/list-events";
import listPotmTool from "./tools/list-player-of-the-match";

export default defineMcp({
  name: "pafc-mcp",
  title: "Peterborough Athletic FC",
  version: "0.1.0",
  instructions:
    "Read-only tools for Peterborough Athletic FC ('The Lions'). Use `list_news` for recent published articles, `list_events` for upcoming club events, and `list_player_of_the_match` for recent POTM awards.",
  tools: [listNewsTool, listEventsTool, listPotmTool],
});
