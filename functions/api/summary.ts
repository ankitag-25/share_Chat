export async function onRequest(context) {
  const apiKey = context.env.ANTHROPIC_API_KEY;
  if (!apiKey) return Response.json({ error: "No API key" }, { status: 500 });

  const body = await context.request.json();
  const { tag, description } = body;

  const prompt = `भारत में अभी "${tag}" ट्रेंड कर रहा है${description ? ` (${description})` : ""}। एक आम पाठक के लिए 3-4 लाइन में हिंदी में सरल भाषा में बताओ कि यह क्या है, क्यों चर्चा में है, और मुख्य बातें क्या हैं। सिर्फ summary text return करो, कोई heading या bullet नहीं।`;

  try {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: "claude-sonnet-4-5", max_tokens: 512, messages: [{ role: "user", content: prompt }] }),
    });

    if (!resp.ok) throw new Error(`Anthropic ${resp.status}`);
    const data = await resp.json();
    const summary = data.content?.[0]?.text ?? "";
    return Response.json({ summary });
  } catch (e) {
    return Response.json({ summary: `"${tag}" इस वक्त भारत में चर्चा में है।` });
  }
}
