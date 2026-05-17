import { createServerFn } from "@tanstack/react-start";

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

export const getTrends = createServerFn({ method: "GET" }).handler(async () => {
  const now = new Date();
  const apiKey = process.env.ANTHROPIC_API_KEY;
  console.log("handler called, apiKey present:", !!apiKey);
  return { trends: buildScores(FALLBACK_TRENDS), fetchedAt: now.toISOString(), degraded: true };
});
