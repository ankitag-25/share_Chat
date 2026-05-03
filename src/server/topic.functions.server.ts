import { createServerFn } from "@tanstack/react-start";

const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";

function ensureKey() {
  const k = process.env.ANTHROPIC_API_KEY;
  if (!k) throw new Error("ANTHROPIC_API_KEY is not configured");
  return k;
}

async function callClaude(key: string, prompt: string, maxTokens = 1024): Promise<string> {
  const resp = await fetch(ANTHROPIC_API, {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    throw new Error(`Anthropic API ${resp.status}: ${txt}`);
  }
  const data = await resp.json();
  return (data.content?.[0]?.text ?? "").trim();
}

export const getTopicSummary = createServerFn({ method: "POST" })
  .inputValidator((data: { tag: string; description?: string }) => data)
  .handler(async ({ data }) => {
    const key = ensureKey();
    const prompt = `भारत में अभी "${data.tag}" ट्रेंड कर रहा है${
      data.description ? ` (${data.description})` : ""
    }। एक आम पाठक के लिए 3-4 लाइन में हिंदी में सरल भाषा में बताओ कि यह क्या है, क्यों चर्चा में है, और मुख्य बातें क्या हैं। सिर्फ summary text return करो, कोई heading या bullet नहीं।`;

    try {
      const summary = await callClaude(key, prompt);
      return { summary, degraded: false };
    } catch (e) {
      console.error("Summary failed:", e);
      const err = e as Error;
      const fallback = err.message.includes("429")
        ? "अभी ट्रैफ़िक ज़्यादा है — कुछ देर में फिर से try करें।"
        : `"${data.tag}" इस वक्त भारत में चर्चा में है${
            data.description ? ` — ${data.description}.` : "."
          } विस्तृत summary अभी उपलब्ध नहीं है।`;
      return { summary: fallback, degraded: true };
    }
  });

// Note: Anthropic's API does not support image generation.
// getTopicImages returns empty — wire up a separate image search if needed.
export const getTopicImages = createServerFn({ method: "POST" })
  .inputValidator((data: { tag: string; description?: string; category?: string }) => data)
  .handler(async () => {
    return { images: [] as string[] };
  });
