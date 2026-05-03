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
