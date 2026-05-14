export async function onRequest(context) {
  const apiKey = context.env.ANTHROPIC_API_KEY;
  if (!apiKey) return Response.json({ error: "No API key" }, { status: 500 });
 
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    timeZone: "Asia/Kolkata"
  });
  const timeStr = now.toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata"
  });
 
  const prompt = `Today is ${dateStr}, ${timeStr} IST.
 
Use your web search tool to find what is ACTUALLY trending in India RIGHT NOW today. Search for:
1. "India trending today ${now.toISOString().split('T')[0]}"
2. "India news today trending topics"
3. "Twitter trending India today"
 
Based on your real web search results, return exactly 10 currently trending topics in India as a JSON array. Each item must have:
- "tag": English hashtag starting with # in CamelCase (e.g. #IndiaVsPakistan)
- "description": 1 line in Hindi explaining why it is trending right now
- "category": one of — sports, news, entertainment, weather, finance, technology, politics, religion, lifestyle, health
- "heatScore": number 1-10 based on how viral it actually is right now
- "source": where the signal came from (e.g. "Twitter + News", "Google Trends", "NewsAPI")
 
IMPORTANT: These must be REAL trends happening TODAY — not generic or made up. Use your web search to verify.
Return ONLY the JSON array, no other text, no markdown backticks.`;
 
  try {
    // First call — with web search tool enabled
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 4000,
        tools: [
          {
            type: "web_search_20250305",
            name: "web_search"
          }
        ],
        messages: [{ role: "user", content: prompt }]
      })
    });
 
    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`Anthropic ${resp.status}: ${errText}`);
    }
 
    const data = await resp.json();
 
    // Claude may do tool use first, then give a final text response
    // We need to handle the agentic loop — keep calling until we get a final text
    let finalText = "";
    let messages = [{ role: "user", content: prompt }];
 
    // Process the response — if it used tools, run the loop
    let currentResponse = data;
 
    for (let i = 0; i < 5; i++) {
      const content = currentResponse.content || [];
      const stopReason = currentResponse.stop_reason;
 
      // Collect any text blocks
      const textBlocks = content.filter(b => b.type === "text");
      if (textBlocks.length > 0) {
        finalText = textBlocks.map(b => b.text).join("");
      }
 
      // If stop reason is end_turn, we're done
      if (stopReason === "end_turn") break;
 
      // If stop reason is tool_use, we need to continue the loop
      if (stopReason === "tool_use") {
        const toolUseBlocks = content.filter(b => b.type === "tool_use");
 
        if (toolUseBlocks.length === 0) break;
 
        // Add assistant message with tool use to history
        messages.push({ role: "assistant", content });
 
        // Add tool results
        const toolResults = toolUseBlocks.map(tool => ({
          type: "tool_result",
          tool_use_id: tool.id,
          content: tool.input?.query
            ? `Search completed for: ${tool.input.query}. Results are available.`
            : "Search completed."
        }));
 
        messages.push({ role: "user", content: toolResults });
 
        // Continue the conversation
        const continueResp = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json"
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-5",
            max_tokens: 4000,
            tools: [{ type: "web_search_20250305", name: "web_search" }],
            messages
          })
        });
 
        if (!continueResp.ok) break;
        currentResponse = await continueResp.json();
      } else {
        break;
      }
    }
 
    if (!finalText) throw new Error("No text response from Claude");
 
    // Parse the JSON array from the response
    const clean = finalText.replace(/```(?:json)?/g, "").trim();
    const match = clean.match(/\[[\s\S]*\]/);
    if (!match) throw new Error("No JSON array found in response");
 
    const parsed = JSON.parse(match[0]);
 
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error("Empty or invalid trends array");
    }
 
    return Response.json({
      trends: parsed,
      fetchedAt: now.toISOString(),
      degraded: false,
      source: "live"
    }, {
      headers: {
        // Cache for 5 minutes only — these are live trends
        "Cache-Control": "public, max-age=300"
      }
    });
 
  } catch (e) {
    console.error("Trends API error:", String(e));
    return Response.json({
      error: String(e),
      degraded: true
    }, { status: 500 });
  }
}
