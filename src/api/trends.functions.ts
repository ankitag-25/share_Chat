export type TrendItem = {
  tag: string;
  description: string;
  category: string;
  source: string;
  heatScore: number;
  score: {
    total: number;
    inapp: number;
    trends: number;
    news: number;
    twitter: number;
    crossBonus: number;
    matches: number;
  };
};
 
const FALLBACK_TRENDS: Omit<TrendItem, "score">[] = [
  { tag: "#IndiaVsAustralia", description: "क्रिकेट मैच, खेल खबरों और सोशल पर ट्रेंड", category: "sports", heatScore: 9, source: "Twitter + Cricket News" },
  { tag: "#MumbaiRains", description: "मौसम घटना, स्थानीय engagement ज़्यादा", category: "weather", heatScore: 8, source: "IMD + Twitter" },
  { tag: "#Diwali2026", description: "त्योहार, सर्च volume तेज़ी से बढ़ रहा", category: "religion", heatScore: 8, source: "Google Trends" },
  { tag: "#RBIRepoRateCut", description: "वित्तीय खबर, mainstream coverage", category: "finance", heatScore: 7, source: "News + Twitter" },
  { tag: "#StrangerThings5", description: "OTT release, entertainment buzz", category: "entertainment", heatScore: 8, source: "Google Trends + OTT" },
  { tag: "#BollywoodBuzz", description: "नई फ़िल्म announcement पर चर्चा", category: "entertainment", heatScore: 6, source: "Twitter" },
  { tag: "#TechLayoffs", description: "IT सेक्टर की खबरें", category: "technology", heatScore: 6, source: "News" },
  { tag: "#ElectionUpdates", description: "राजनीतिक हलचल", category: "politics", heatScore: 7, source: "News + Twitter" },
  { tag: "#HealthAlert", description: "स्वास्थ्य संबंधी advisory", category: "health", heatScore: 5, source: "News" },
  { tag: "#StartupIndia", description: "नए funding rounds की खबरें", category: "technology", heatScore: 5, source: "News + Twitter" },
];
 
function buildScores(raw: Omit<TrendItem, "score">[]): TrendItem[] {
  const W = { inapp: 0.35, trends: 0.25, news: 0.2, twitter: 0.2 };
  const inAppData: Record<string, number> = {};
  const googleTrends: string[] = [];
  const newsApi: string[] = [];
  const twitter: string[] = [];
 
  raw.forEach((t, i) => {
    const base = Math.max(500, t.heatScore * 200);
    inAppData[t.tag] = base + Math.floor(Math.random() * 200) - 100;
    if (i < 7) googleTrends.push(t.tag);
    if (["news", "politics", "finance", "weather"].includes(t.category?.toLowerCase())) newsApi.push(t.tag);
    if (i < 7) twitter.push(t.tag);
  });
 
  const maxRaw = Math.max(1, ...Object.values(inAppData));
 
  return raw.map((t) => {
    const inapp = (inAppData[t.tag] / maxRaw) * 100;
    const tr = googleTrends.indexOf(t.tag) === -1 ? 0 : Math.max(0, 100 - googleTrends.indexOf(t.tag) * 12);
    const nw = newsApi.indexOf(t.tag) === -1 ? 0 : Math.max(0, 100 - newsApi.indexOf(t.tag) * 12);
    const tw = twitter.indexOf(t.tag) === -1 ? 0 : Math.max(0, 100 - twitter.indexOf(t.tag) * 12);
    const matches = [tr, nw, tw].filter((v) => v > 0).length;
    const crossBonus = matches >= 2 ? (matches - 1) * 8 : 0;
    const total = Math.min(100, Math.round(W.inapp * inapp + W.trends * tr + W.news * nw + W.twitter * tw + crossBonus));
    return {
      ...t,
      score: { total, inapp: Math.round(inapp), trends: Math.round(tr), news: Math.round(nw), twitter: Math.round(tw), crossBonus, matches },
    };
  }).sort((a, b) => b.score.total - a.score.total);
}
 
async function fetchFromClaude(): Promise<Omit<TrendItem, "score">[]> {
  const apiKey = (import.meta as any).env?.VITE_ANTHROPIC_API_KEY ?? "";
  if (!apiKey) throw new Error("No API key");
 
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Kolkata",
  });
  const timeStr = now.toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata",
  });
 
  const prompt = `Today is ${dateStr}, ${timeStr} IST.
 
Search the web for what is ACTUALLY trending in India right now. Look for current Indian news, sports, entertainment, weather alerts, political developments, and viral social media topics happening TODAY on ${now.toISOString().split("T")[0]}.
 
Return exactly 10 real trending topics as a JSON array. Each item:
- "tag": English hashtag starting with # CamelCase
- "description": 1 line Hindi explanation of why trending RIGHT NOW
- "category": sports/news/entertainment/weather/finance/technology/politics/religion/lifestyle/health
- "heatScore": 1-10
- "source": signal origin (e.g. "Twitter + News")
 
Return ONLY the raw JSON array. No markdown, no backticks, no explanation.`;
 
  const callClaude = async (messages: any[]) => {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 3000,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages,
      }),
    });
    if (!resp.ok) throw new Error(`Claude API ${resp.status}: ${await resp.text()}`);
    return resp.json();
  };
 
  let messages: any[] = [{ role: "user", content: prompt }];
  let data = await callClaude(messages);
  let finalText = "";
 
  for (let i = 0; i < 6; i++) {
    const { content, stop_reason } = data;
    const texts = (content ?? []).filter((b: any) => b.type === "text");
    if (texts.length > 0) finalText = texts.map((b: any) => b.text).join("");
    if (stop_reason === "end_turn") break;
 
    if (stop_reason === "tool_use") {
      messages.push({ role: "assistant", content });
      const toolResults = (content ?? [])
        .filter((b: any) => b.type === "tool_use")
        .map((b: any) => ({ type: "tool_result", tool_use_id: b.id, content: "Search completed." }));
      messages.push({ role: "user", content: toolResults });
      data = await callClaude(messages);
    } else {
      break;
    }
  }
 
  if (!finalText) throw new Error("No response text from Claude");
  const clean = finalText.replace(/```(?:json)?/g, "").trim();
  const match = clean.match(/\[[\s\S]*\]/);
  if (!match) throw new Error("No JSON array in response");
  return JSON.parse(match[0]);
}
 
export async function getTrends(): Promise<{ trends: TrendItem[]; fetchedAt: string; degraded?: boolean }> {
  const now = new Date();
  try {
    const raw = await fetchFromClaude();
    if (!Array.isArray(raw) || raw.length === 0) throw new Error("Empty array");
    return { trends: buildScores(raw), fetchedAt: now.toISOString(), degraded: false };
  } catch (e) {
    console.warn("Claude fetch failed, using fallback:", e);
    return { trends: buildScores(FALLBACK_TRENDS), fetchedAt: now.toISOString(), degraded: true };
  }
}
