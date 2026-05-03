Trending Tags System for ShareChat
Technical & Product README

Part 1 — How the Trending System Works
1.1  Signal Sources
The system pulls from three external sources plus one internal signal, each chosen because they capture a different kind of trending behaviour:

Google Trends	Captures search intent — what people are actively looking up. Strong for events with a build-up (festivals, matches, elections). Weight: 25%

NewsAPI	Captures editorial coverage — what journalists consider important enough to publish. Strongest for finance, politics, weather alerts. Weight: 20%

Twitter / X	Captures real-time social pulse — reactions, memes, breaking news that hasn't hit editorial yet. Weight: 20%

In-App Signals	ShareChat-internal shares + downloads per tag. This is proprietary signal — the most direct measure of what our own users actually engage with. Weight: 35% (highest weight)

1.2  Scoring Logic & Weights
Each tag gets a composite score out of 100, built in two stages:

Stage 1 — Per-source score
For Google Trends and Twitter, the tag's rank position determines its score: rank 1 = 100 points, rank 2 = 88, rank 3 = 76... (drops 12 per rank). For NewsAPI, same position-based decay. For in-app signals, shares + downloads are normalised against the top-performing tag of the day.

Stage 2 — Composite + Cross-source Bonus
Final score = (0.35 × inapp) + (0.25 × trends) + (0.20 × news) + (0.20 × twitter) + cross_bonus
Cross-source bonus: if a tag appears in 2+ external sources simultaneously, it gets +8 points per additional source. This rewards genuinely viral content over single-source spikes.

1.3  AI Generation Layer
Claude Sonnet (claude-sonnet-4-5) is called via the Anthropic API at every page load. The prompt is date-and-time aware (IST timezone), asks for 10 trending topics mixing sports, politics, entertainment, weather, finance — and returns a structured JSON array with tag, description (Hindi), category, heatScore (1–10), and source signal string.

•	Why Claude Sonnet? Fast enough for a page-load API call, strong at Hindi, good at structured JSON output without hallucinating format.
•	Why not a static list? Because trending is by definition time-sensitive. A festival tag is useless three days after the festival. The AI call ensures the tags feel current every time.
•	Fallback: If the API call fails (rate limit, downtime), the system serves a hardcoded FALLBACK_TRENDS array with the same scoring logic applied. Users always see something meaningful.

1.4  Filters & Ranking
•	Tags are sorted by composite score descending.
•	Categories are mixed — the prompt explicitly asks Claude to vary across verticals so the feed doesn't become all-cricket or all-politics.
•	Top 8 tags are surfaced in the pill UI. The remaining tags exist in data but aren't shown to avoid overwhelming the user.

