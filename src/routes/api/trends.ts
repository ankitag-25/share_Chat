import { createAPIFileRoute } from "@tanstack/start/api";
 
export const APIRoute = createAPIFileRoute("/api/trends")({
  GET: async ({ request }) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
 
    if (!apiKey) {
      return Response.json({ error: "No API key configured" }, { status: 500 });
    }
 
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "Asia/Kolkata",
    });
    const timeStr = now.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Kolkata",
    });
 
    const prompt = `Today is ${dateStr}, ${timeStr} IST.
 
Use your web_search tool to find what is ACTUALLY trending in India RIGHT NOW. Search for current news and trending topics.
 
Based on real web search results, return exactly 10 currently trending topics in India as a JSON array. Each item must have:
- "tag": English hashtag starting with # in CamelCase (e.g. #IndiaVsPakistan)  
- "description": 1 line in Hindi explaining why it is trending right now
- "category": one of — sports, news, entertainment, weather, finance, technology, politics, religion, lifestyle, health
- "heatScore": number 1-10 based on how viral it actually is right now
- "source": where the signal came from (e.g. "Twitter + News", "Google Trends")
 
Return ONLY a valid JSON array, no markdown, no explanation, no backticks.`;
 
    try {
      // Initial request with web_search tool
      const firstResp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-5",
          max_tokens: 4000,
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          messages: [{ role: "user", content: prompt }],
        }),
      });
 
      if (!firstResp.ok) {
        const err = await firstResp.text();
        throw new Error(`Anthropic API error ${firstResp.status}: ${err}`);
      }
 
      let currentData = await firstResp.json();
      let messages: any[] = [{ role: "user", content: prompt }];
      let finalText = "";
 
      // Agentic loop — keep going until end_turn
      for (let i = 0; i < 6; i++) {
        const { content, stop_reason } = currentData;
 
        // Grab any text in this response
        const texts = content.filter((b: any) => b.type === "text");
        if (texts.length > 0) {
          finalText = texts.map((b: any) => b.text).join("");
        }
 
        if (stop_reason === "end_turn") break;
 
        if (stop_reason === "tool_use") {
          // Add assistant turn to history
          messages.push({ role: "assistant", content });
 
          // Build tool results
          const toolResults = content
            .filter((b: any) => b.type === "tool_use")
            .map((b: any) => ({
              type: "tool_result",
              tool_use_id: b.id,
              content: "Search completed successfully.",
            }));
 
          messages.push({ role: "user", content: toolResults });
 
          // Continue
          const nextResp = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "x-api-key": apiKey,
              "anthropic-version": "2023-06-01",
              "content-type": "application/json",
            },
            body: JSON.stringify({
              model: "claude-sonnet-4-5",
              max_tokens: 4000,
              tools: [{ type: "web_search_20250305", name: "web_search" }],
              messages,
            }),
          });
 
          if (!nextResp.ok) break;
          currentData = await nextResp.json();
        } else {
          break;
        }
      }
 
      if (!finalText) throw new Error("No text response received from Claude");
 
      // Extract JSON array
      const clean = finalText.replace(/```(?:json)?/g, "").trim();
      const match = clean.match(/\[[\s\S]*\]/);
      if (!match) throw new Error("No JSON array in response: " + clean.slice(0, 200));
 
      const trends = JSON.parse(match[0]);
      if (!Array.isArray(trends) || trends.length === 0) {
        throw new Error("Empty trends array returned");
      }
 
      return Response.json({
        trends,
        fetchedAt: now.toISOString(),
        degraded: false,
        source: "live",
      });
    } catch (e) {
      console.error("Trends API error:", String(e));
      return Response.json({ error: String(e), degraded: true }, { status: 500 });
    }
  },
});
