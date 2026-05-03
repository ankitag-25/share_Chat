export async function getTopicSummary({ data }: { data: { tag: string; description?: string } }) {
  try {
    const resp = await fetch("/api/summary", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return await resp.json() as { summary: string };
  } catch {
    return {
      summary: `"${data.tag}" इस वक्त भारत में चर्चा में है${data.description ? ` — ${data.description}.` : "."}`,
    };
  }
}

export async function getTopicImages({ data }: { data: { tag: string; description?: string; category?: string } }) {
  return { images: [] as string[] };
}
