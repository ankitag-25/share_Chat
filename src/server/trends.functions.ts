import { createServerFn } from "@tanstack/react-start";

export type TrendItem = {
  tag: string;
  description: string;
  category: string;
  source: string;
  heatScore: number; // 1-10 from model
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

const W = { inapp: 0.35, trends: 0.25, news: 0.2, twitter: 0.2 };
const CROSS_BONUS = 8;

function thirdPartyScore(tag: string, arr: string[]) {
  const idx = arr.indexOf(tag);
  return idx === -1 ? 0 : Math.max(0, 100 - idx * 12);
}

function buildScores(aiTags: Omit<TrendItem, "score">[]): TrendItem[] {
  const inAppData: Record<string, { shares: number; downloads: number }> = {};
  const googleTrends: string[] = [];
  const newsApi: string[] = [];
  const twitter: string[] = [];

  aiTags.forEach((t, i) => {
    const base = Math.max(500, t.heatScore * 200);
    const j = () => Math.floor(Math.random() * 300) - 100;
    inAppData[t.tag] = { shares: base + j(), downloads: Math.floor(base * 0.4) + j() };
    if (i < 7) googleTrends.push(t.tag);
    if (["news", "politics", "finance", "weather"].includes(t.category?.toLowerCase()))
      newsApi.push(t.tag);
    if (i < 7) twitter.push(t.tag);
  });

  const maxRaw = Math.max(
    1,
    ...Object.values(inAppData).map((v) => v.shares + v.downloads),
  );

  return aiTags
    .map((t) => {
      const inapp = ((inAppData[t.tag].shares + inAppData[t.tag].downloads) / maxRaw) * 100;
      const trends = thirdPartyScore(t.tag, googleTrends);
      const news = thirdPartyScore(t.tag, newsApi);
      const tw = thirdPartyScore(t.tag, twitter);
      const matches = [trends, news, tw].filter((v) => v > 0).length;
      const crossBonus = matches >= 2 ? (matches - 1) * CROSS_BONUS : 0;
      const base = W.inapp * inapp + W.trends * trends + W.news * news + W.twitter * tw;
      const total = Math.min(100, Math.round(base + crossBonus));
      return {
        ...t,
        score: {
          total,
          inapp: Math.round(inapp),
          trends: Math.round(trends),
          news: Math.round(news),
          twitter: Math.round(tw),
          crossBonus,
          matches,
        },
      };
    })
    .sort((a, b) => b.score.total - a.score.total);
}

export const getTrends = createServerFn({ method: "GET" }).handler(async () => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured");

  const now = new Date();
  const dateStr = now.toLocaleDateString("hi-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeStr = now.toLocaleTimeString("hi-IN", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });

  const prompt = `आज ${dateStr}, समय ${timeStr} IST है। भारत में अभी सोशल मीडिया, न्यूज़ और सर्च ट्रेंड्स पर सबसे ज़्यादा चर्चा में क्या है?

10 ट्रेंडिंग टॉपिक्स की एक JSON array दो। हर item में:
- "tag": अंग्रेज़ी हैशटैग (# से शुरू, CamelCase, जैसे #IndiaVsAustralia, #MumbaiRains, #Diwali2026, #RBIRepoRateCut, #StrangerThings5)
- "description": 1 लाइन में हिंदी में बताओ क्यों ट्रेंड कर रहा है (जैसे "क्रिकेट मैच, खेल खबरों और सोशल पर ट्रेंड", "मौसम घटना, स्थानीय engagement ज़्यादा")
- "category": एक word — sports, news, entertainment, weather, finance, technology, politics, religion, lifestyle, या health
- "heatScore": 1-10 (10 = सबसे वायरल)
- "source": signal कहाँ से, जैसे "Twitter + Cricket News", "IMD + Twitter", "Google Trends + OTT"

सिर्फ JSON array return करो, कोई extra text नहीं। हर बार अलग-अलग, असली, विश्वसनीय topics दो — sports, politics, entertainment, weather, finance सब mix करो। आज की तारीख और हाल के events को ध्यान में रखो।`;

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!resp.ok) {
    console.error(`Anthropic API error [${resp.status}]`, await resp.text().catch(() => ""));
    const ranked = buildScores(FALLBACK_TRENDS);
    return {
      trends: ranked,
      fetchedAt: now.toISOString(),
      degraded: true,
      error:
        resp.status === 429
          ? "अभी ट्रैफ़िक ज़्यादा है — कुछ देर में फिर से try करें।"
          : resp.status === 401
            ? "API key invalid — .env में ANTHROPIC_API_KEY चेक करें।"
            : "ट्रेंड्स अभी load नहीं हो पाए, demo data दिखाया जा रहा है।",
    };
  }

  const data = await resp.json();
  const content: string = data.content?.[0]?.text ?? "";

  let parsed: Omit<TrendItem, "score">[];
  try {
    const clean = content.replace(/```(?:json)?/g, "").trim();
    parsed = JSON.parse(clean);
    if (!Array.isArray(parsed)) throw new Error("not an array");
  } catch {
    const m = content.match(/\[[\s\S]*\]/);
    if (!m) {
      const ranked = buildScores(FALLBACK_TRENDS);
      return { trends: ranked, fetchedAt: now.toISOString(), degraded: true };
    }
    parsed = JSON.parse(m[0]);
  }

  const ranked = buildScores(parsed ?? []);
  return { trends: ranked, fetchedAt: now.toISOString(), degraded: false };
});

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
