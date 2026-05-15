import { createServerFn } from "@tanstack/react-start";

export const getTopicSummary = createServerFn({ method: "GET" })
  .validator((data: { tag: string; description?: string }) => data)
  .handler(async ({ data }) => {
    const { tag, description } = data;
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) return { summary: `"${tag}" इस वक्त भारत में चर्चा में है।` };

    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-5",
          max_tokens: 512,
          messages: [{
            role: "user",
            content: `भारत में अभी "${tag}" ट्रेंड कर रहा है${description ? ` — ${description}` : ""}। 3-4 लाइन में हिंदी में सरल भाषा में बताओ कि यह क्या है और क्यों चर्चा में है। सिर्फ summary text दो।`
          }]
        }),
      });
      const result = await resp.json() as any;
      return { summary: result.content?.[0]?.text ?? `"${tag}" इस वक्त भारत में चर्चा में है।` };
    } catch {
      return { summary: `"${tag}" इस वक्त भारत में चर्चा में है।` };
    }
  });

export const getTopicImages = createServerFn({ method: "GET" })
  .validator((data: { tag: string; description?: string; category?: string }) => data)
  .handler(async () => {
    return { images: [] as string[] };
  });


