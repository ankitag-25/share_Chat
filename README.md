# हिंदी ट्रेंड्स 🇮🇳

A live AI-powered trending topics feed for India, built with TanStack Start, React 19, Tailwind CSS v4, and the Anthropic API.

## Features

- **Live trends** — Claude generates 10 fresh trending topics for India on every load, mixing sports, news, entertainment, weather, finance, politics and more
- **AI summaries** — tap "और देखें →" on any trend card for a Hindi summary powered by Claude
- **Auto-refresh** — trends update automatically every 3 minutes
- **Mobile-first UI** — phone-shell mockup with bottom nav, tag pills, post cards, like buttons
- **Graceful fallback** — static fallback data if the API is unavailable

## Stack

| Layer | Tech |
|---|---|
| Framework | [TanStack Start](https://tanstack.com/start) |
| UI | React 19 + Tailwind CSS v4 + shadcn/ui |
| AI | [Anthropic Claude](https://docs.anthropic.com) (`claude-sonnet-4-5`) |
| Deployment | Cloudflare Workers (via `wrangler`) |

## Getting started

### 1. Clone & install

```bash
git clone https://github.com/your-username/hindi-trends.git
cd hindi-trends
npm install
```

### 2. Set up environment

```bash
cp .env.example .env
# Edit .env and add your Anthropic API key
```

Get your API key at [console.anthropic.com](https://console.anthropic.com).

### 3. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment

### Cloudflare Workers

```bash
# Add your secret to Cloudflare
npx wrangler secret put ANTHROPIC_API_KEY

# Deploy
npm run build && npx wrangler deploy
```

## Project structure

```
src/
├── routes/
│   ├── __root.tsx        # HTML shell, fonts
│   └── index.tsx         # Main page + all UI
├── server/
│   ├── trends.functions.ts   # getTrends — Claude generates trending topics
│   └── topic.functions.ts    # getTopicSummary — Claude summarises a topic
└── styles.css            # Tailwind + Hindi Trends design tokens
```

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | ✅ | Your Anthropic API key |

## License

MIT
