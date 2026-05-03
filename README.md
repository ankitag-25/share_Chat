Part 1 — How the Trending System Works
Signal Sources
The system pulls from three external sources plus one internal signal. Each was chosen because it captures a different kind of trending behaviour:

Prototype Note: In a production build, each of these sources would be a live API integration (Google Trends, NewsAPI, Twitter ). In this prototype, all four signals are simulated and unified through a single Anthropic Claude API call — Claude is prompted with today's date and time and asked to reason about what would realistically be trending across all these sources right now. The weights, scoring formula, and cross-source bonus logic are all real and production-ready — only the data ingestion layer is mocked.

Source :Google Trends (25% Weightage) , Search intent — what people are actively looking up. Strong for build-up events (festivals, matches, elections)
Source: NewsAPI (20% Weightage) , Editorial coverage — what journalists consider important. Strongest for finance, politics, weather alerts
Twitter / X: (20% Weightage), Real-time social pulse — reactions, memes, breaking news that hasn't hit editorial yet
In-App Signals : (35% Weightage), ShareChat-internal shares + downloads per tag. Most direct measure of what our users actually engage with

Scoring Logic
Each tag gets a composite score out of 100, built in two stages:
Stage 1 — Per-source score
For Google Trends and Twitter, rank position determines the score:

Rank 1 → 100 points
Rank 2 → 88 points
Rank 3 → 76 points (drops 12 per rank)

For in-app signals, shares + downloads are normalised against the top-performing tag of the day.
Stage 2 — Composite + Cross-source Bonus
Final Score = (0.35 × inapp) + (0.25 × trends) + (0.20 × news) + (0.20 × twitter) + cross_bonus
Cross-source bonus: if a tag appears in 2+ external sources simultaneously, it gets +8 points per additional source. This rewards genuinely viral content over single-source spikes — a tag trending only on Twitter might be noise; a tag trending on Twitter and in news and in search is real signal.
Scores are capped at 100. Tags are sorted descending. Top 8 surface in the pill UI.



UX Design Decisions
Horizontal scrollable pills — not a list
The most natural pattern for trending tags on mobile. Twitter, Instagram Reels, and YouTube Shorts all use this. A vertical ranked list was considered and rejected — it takes too much vertical space and buries content below the fold. Pills let users scan max 8 tags in one glance without scrolling.
Rank numbers on pills
Each pill shows 1, 2, 3... so the user immediately understands what's #1 vs #8. Without rank numbers, all pills look equally important and the scoring work becomes invisible.
Category emoji as visual shorthand
🏏 sports · 💰 finance · 🌧️ weather · 🎬 entertainment · 🏛️ politics

Inline detail expansion — not a separate page
Tapping a tag expands a detail card inline in the same feed. Full-page navigation was considered and rejected because:

It breaks the feed scroll context
Mobile users expect sheet/drawer patterns for quick lookups, not full navigations for transient content

Detail card surfaces all metadata
The expanded card shows: rank badge, category chip, heat score (🔥 x/10), source signal, and a visual heat intensity bar. 
Summary behind a tap — not auto-loaded. This also creates a sense of depth — the user feels like they're unlocking more information.
Related post card per trend
The detail view shows a realistic social post seeded from the trend's own data — text, author, likes, and views all derived from the trend's heatScore and tag. Satisfies the "content in detail view" requirement without needing a separate content API.




What I'd Build Next — 4 More Weeks

1. Week 1  Real data pipeline: Remove anthropics Stimulated APIs and source real ones
2. Week 2-4  feed accuracy. Currently sharechat seems to meet trends and topics at max 70-80 percent. I would work on making the feed more accurate and work on creating a deeper algorithm for that
