Part 1 — How the Trending System Works
Signal Sources
The system pulls from three external sources plus one internal signal. Each was chosen because it captures a different kind of trending behaviour:

Prototype Note: In a production build, each of these sources would be a live API integration (Google Trends, NewsAPI, Twitter ). In this prototype, all four signals are simulated and unified through a single Anthropic Claude API call — Claude is prompted with today's date and time and asked to reason about what would realistically be trending across all these sources right now. The weights, scoring formula, and cross-source bonus logic are all real and production-ready — only the data ingestion layer is mocked.

Source                What it captures                                                                     Weight        Status in prototype

Google Trends         Search intent — what people are actively looking up. Strong for build-up             25%           Simulated via Claude
                      events (festivals, matches, elections)
