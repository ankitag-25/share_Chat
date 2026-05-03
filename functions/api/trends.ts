export async function onRequest(context) {
  const apiKey = context.env.ANTHROPIC_API_KEY;
  if (!apiKey) return Response.json({ error: "No API key" }, { status: 500 });

  const now = new Date();
  const dateStr = now.toLocaleDateString("hi-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const timeStr = now.toLocaleTimeString("hi-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" });

  const prompt = `आज ${dateStr}, समय ${timeStr} IST है। भारत में अभी सोशल मीडिया, न्यूज़ और सर्च ट्रेंड्स पर सबसे ज़्यादा चर्चा में क्या है? 10 ट्रेंडिंग टॉपिक्स की एक JSON array दो। हर item में: "tag" (# से शुरू CamelCase हैशटैग), "description" (1 लाइन हिंदी में), "category" (sports/news/entertainment/weather/finance/technology/politics/religion/lifestyle/health में से एक), "heatScore" (1-10), "source" (जैसे "Twitter + News")। सिर्फ JSON array return करो, कोई extra text नहीं।`;

  try {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: "claude-sonnet-4-5", max_tokens: 2048, messages: [{ role: "user", content: prompt }] }),
    });

    if (!resp.ok) throw new Error(`Anthropic ${resp.status}`);
    const data = await resp.json();
    const text: string = data.content?.[0]?.text ?? "";
    const clean = text.replace(/```(?:json)?/g, "").trim();
    const match = clean.match(/\[[\s\S]*\]/);
    const parsed = JSON.parse(match ? match[0] : clean);

    return Response.json({ trends: parsed, fetchedAt: now.toISOString(), degraded: false });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
