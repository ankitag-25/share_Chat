import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getTrends, type TrendItem } from "@/server/trends.functions";
import { getTopicImages, getTopicSummary } from "@/server/topic.functions";
export const Route = createFileRoute("/")({
  component: HindiTrendsPage,
  loader: async () => {
    try {
      return await getTrends();
    } catch (e) {
      return { trends: [], fetchedAt: new Date().toISOString(), loadError: (e as Error).message };
    }
  },
  head: () => ({
    meta: [
      { title: "हिंदी ट्रेंड्स — Live AI-Powered Trending Topics" },
      {
        name: "description",
        content:
          "भारत में अभी ट्रेंड कर रहे टॉपिक्स — sports, news, entertainment, weather, finance — live AI से।",
      },
    ],
  }),
});

const catClass: Record<string, string> = {
  sports: "ht-cat-sports",
  cricket: "ht-cat-sports",
  news: "ht-cat-news",
  politics: "ht-cat-politics",
  entertainment: "ht-cat-entertainment",
  bollywood: "ht-cat-entertainment",
  weather: "ht-cat-weather",
  finance: "ht-cat-finance",
  economy: "ht-cat-finance",
  technology: "ht-cat-technology",
  ai: "ht-cat-technology",
  religion: "ht-cat-religion",
  festival: "ht-cat-religion",
  lifestyle: "ht-cat-lifestyle",
  health: "ht-cat-health",
};

const catEmoji: Record<string, string> = {
  sports: "🏏", cricket: "🏏", news: "📰", politics: "🏛️",
  entertainment: "🎬", bollywood: "🎬", weather: "🌧️",
  finance: "💰", economy: "💰", technology: "💻", ai: "🤖",
  religion: "🙏", festival: "🎉", lifestyle: "✨", health: "❤️",
};

const getCatClass = (c?: string) => catClass[c?.toLowerCase() ?? ""] ?? "ht-cat-news";
const getCatEmoji = (c?: string) => catEmoji[c?.toLowerCase() ?? ""] ?? "📰";

const TRENDING_LABEL = "आज की हलचल";

// Generate a fake post text for a trend
function getFakePost(trend: TrendItem): { text: string; author: string; initials: string; avCls: string; time: string } {
  const avOptions = [
    { initials: "RK", avCls: "av-o", author: "राजेश कुमार" },
    { initials: "PS", avCls: "av-b", author: "प्रिया सिंह" },
    { initials: "AP", avCls: "av-g", author: "अर्जुन पटेल" },
    { initials: "NS", avCls: "av-p", author: "नेहा शर्मा" },
    { initials: "VM", avCls: "av-o", author: "विकास मेहता" },
  ];
  const idx = Math.abs(trend.tag.charCodeAt(1) + trend.tag.charCodeAt(2)) % avOptions.length;
  const av = avOptions[idx];
  const times = ["1 घंटे पहले", "2 घंटे पहले", "3 घंटे पहले", "4 घंटे पहले"];
  const time = times[Math.abs(trend.tag.charCodeAt(3)) % times.length];
  return { ...av, time, text: trend.description };
}

function HindiTrendsPage() {
  const initial = Route.useLoaderData();
  const [trends, setTrends] = useState<TrendItem[]>(initial.trends);
  const [fetchedAt, setFetchedAt] = useState<string>(initial.fetchedAt);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [clock, setClock] = useState("--:--");
  const [likes, setLikes] = useState<Record<string, boolean>>({});
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summary, setSummary] = useState<string>("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("");

  useEffect(() => {
    try {
      setLastUpdated(
        new Date(fetchedAt).toLocaleTimeString("hi-IN", { hour: "2-digit", minute: "2-digit" }),
      );
    } catch { /* noop */ }
  }, [fetchedAt]);

  useEffect(() => {
    const tick = () => {
      const n = new Date();
      setClock(`${n.getHours().toString().padStart(2, "0")}:${n.getMinutes().toString().padStart(2, "0")}`);
    };
    tick();
    const id = setInterval(tick, 10000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => { void refresh(true); }, 3 * 60 * 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset summary when tag changes
  useEffect(() => {
    setSummaryOpen(false);
    setSummary("");
  }, [activeTag]);

  async function refresh(silent = false) {
    setLoading(true);
    setError(null);
    try {
      const data = await getTrends();
      setTrends(data.trends);
      setFetchedAt(data.fetchedAt);
      if (!silent) showToast("ट्रेंड्स अपडेट हो गए ✓");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  const sportsTag = trends.find((t) => ["sports", "cricket"].includes(t.category?.toLowerCase()));
  const financeTag = trends.find((t) => ["finance", "economy"].includes(t.category?.toLowerCase()));
  const weatherTag = trends.find((t) => t.category?.toLowerCase() === "weather");
  const activeItem = trends.find((t) => t.tag === activeTag) ?? null;
  const activeRank = activeItem ? trends.indexOf(activeItem) + 1 : null;

  async function loadSummary() {
    if (!activeItem) return;
    setSummaryOpen(true);
    if (summary) return;
    setSummaryLoading(true);
    try {
      const r = await getTopicSummary({ data: { tag: activeItem.tag, description: activeItem.description } });
      setSummary(r.summary);
    } catch {
      setSummary("Summary लोड नहीं हो सका।");
    } finally {
      setSummaryLoading(false);
    }
  }

  return (
    <div className="ht-root">
      <div className="ht-phone-wrap">
        <div className="ht-phone-label">
          <span>हिंदी ट्रेंड्स · Live</span>
          <span className="ht-updated-text">
            {error ? "एरर" : loading ? "अपडेट हो रहा है..." : lastUpdated ? `${lastUpdated} पर अपडेट` : ""}
          </span>
          <button
            className={`ht-refresh-mini${loading ? " loading" : ""}`}
            onClick={() => refresh()}
            disabled={loading}
            aria-label="ताज़ा करें"
          >
            <span className={loading ? "ht-spin" : ""}>↻</span>
          </button>
        </div>

        <div className="ht-phone-shell">
          <div className="ht-status-bar">
            <span suppressHydrationWarning>{clock}</span>
            <span>▐ 91%</span>
          </div>

          <div className="ht-top-bar">
            <div className="ht-search-row">
              <div className="ht-logo-badge">हि</div>
              <div className="ht-search-bar">खोजें...</div>
              <div className="ht-icon-btn">🔔</div>
              <div className="ht-icon-btn">👤</div>
            </div>
            <div className="ht-nav-tabs">
              <div className="ht-nav-tab active">Trending</div>
              <div className="ht-nav-tab">Video</div>
              <div className="ht-nav-tab">Following</div>
              <div className="ht-nav-tab">Cricket</div>
            </div>
          </div>

          <div className="ht-feed">

            {/* ── Trending section ── */}
            <div className="ht-section-divider">
              <div className="ht-trending-header">
                <div className="ht-trending-label-group">
                  <div className="ht-fire-dot" />
                  <span className="ht-trending-title">{TRENDING_LABEL}</span>
                  {trends.length > 0 && (
                    <span className="ht-trend-count">{trends.length} topics</span>
                  )}
                </div>
                {activeItem && (
                  <div className="ht-see-all-btn" onClick={loadSummary}>
                    और देखें →
                  </div>
                )}
              </div>

              {/* Tag pills with rank numbers */}
              <div className="ht-tag-pills-scroll">
                {trends.slice(0, 8).map((item, idx) => (
                  <div
                    key={item.tag}
                    className={`ht-tag-pill${item.tag === activeTag ? " active" : ""}`}
                    onClick={() => setActiveTag((cur) => (cur === item.tag ? null : item.tag))}
                  >
                    <span className="ht-pill-rank">{idx + 1}</span>
                    <span className="ht-pill-emoji">{getCatEmoji(item.category)}</span>
                    {item.tag}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Active trend detail card ── */}
            {activeItem && (
              <div className="ht-topic-card">
                {/* Header: rank + tag + close */}
                <div className="ht-topic-head">
                  <div className="ht-topic-head-left">
                    <span className="ht-topic-rank">#{activeRank}</span>
                    <span className="ht-topic-tag">{activeItem.tag}</span>
                  </div>
                  <span className="ht-clear-filter-btn" onClick={() => setActiveTag(null)}>✕</span>
                </div>

                {/* Description */}
                <div className="ht-topic-desc">{activeItem.description}</div>

                {/* Metadata row: category + heat score + source */}
                <div className="ht-topic-meta-row">
                  <span className={`ht-category-chip ${getCatClass(activeItem.category)}`}>
                    {getCatEmoji(activeItem.category)} {activeItem.category}
                  </span>
                  <div className="ht-heat-badge">
                    🔥 {activeItem.heatScore}/10
                  </div>
                  <div className="ht-source-badge">
                    📡 {activeItem.source}
                  </div>
                </div>

                {/* Heat bar */}
                <div className="ht-heat-bar-wrap">
                  <div className="ht-heat-bar-label">Trend Intensity</div>
                  <div className="ht-heat-bar-track">
                    <div
                      className="ht-heat-bar-fill"
                      style={{ width: `${activeItem.heatScore * 10}%` }}
                    />
                  </div>
                </div>

                {/* Related post — AI generated content using trend data */}
                <div className="ht-topic-related-head">संबंधित पोस्ट</div>
                <div className="ht-related-post-card">
                  {(() => {
                    const post = getFakePost(activeItem);
                    return (
                      <>
                        <div className="ht-related-head-row">
                          <div className={`ht-avatar ${post.avCls}`}>{post.initials}</div>
                          <div className="ht-related-meta">
                            <div className="ht-related-name">{post.author}</div>
                            <div className="ht-related-sub">@{post.author.toLowerCase().replace(" ", "_")} · {post.time}</div>
                          </div>
                          <button className="ht-follow-btn-small">Follow</button>
                        </div>
                        <div className="ht-related-post-text">
                          {getCatEmoji(activeItem.category)} {activeItem.description}
                          <br /><br />
                          {activeItem.tag} पर अभी सबसे ज़्यादा चर्चा हो रही है। आप क्या सोचते हैं? 👇
                        </div>
                        <div className="ht-related-tags-row">
                          <span className="ht-inline-tag">{activeItem.tag}</span>
                          <span className="ht-inline-tag">#{activeItem.category}</span>
                        </div>
                        <div className="ht-post-actions">
                          <div
                            className={`ht-action-btn${likes[`trend_${activeItem.tag}`] ? " liked" : ""}`}
                            onClick={() => setLikes((l) => ({ ...l, [`trend_${activeItem.tag}`]: !l[`trend_${activeItem.tag}`] }))}
                          >
                            {likes[`trend_${activeItem.tag}`] ? "♥" : "♡"} {Math.floor(activeItem.heatScore * 412)}
                          </div>
                          <div className="ht-action-btn">💬 {Math.floor(activeItem.heatScore * 89)}</div>
                          <div className="ht-action-btn">↗ {Math.floor(activeItem.heatScore * 203)}</div>
                          <div className="ht-views-count">{(activeItem.heatScore * 1.2).toFixed(1)}L views</div>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* AI Summary section */}
                {!summaryOpen && (
                  <button className="ht-summary-trigger" onClick={loadSummary}>
                    🤖 AI सारांश देखें →
                  </button>
                )}
                {summaryOpen && (
                  <div className="ht-topic-summary">
                    <div className="ht-summary-head">🤖 AI सारांश</div>
                    {summaryLoading ? (
                      <div className="ht-summary-loading">
                        <span className="ht-spin" style={{ display: "inline-block", marginRight: 6 }}>↻</span>
                        लोड हो रहा है...
                      </div>
                    ) : (
                      <div className="ht-summary-text">{summary}</div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Feed posts ── */}
            <PostCard
              avatarCls="av-o" initials="RK" author="राजेश कुमार" time="2 घंटे पहले"
              text="भारत-ऑस्ट्रेलिया मैच में रोमांच चरम पर, आखिरी ओवर में सब कुछ बदल गया! 🏏"
              tag={(sportsTag ?? trends[0])?.tag}
              onTag={setActiveTag}
              liked={!!likes.p1} onLike={() => setLikes((l) => ({ ...l, p1: !l.p1 }))}
              likeCount="4.3k" comments="312" shares="1.9k" views="1.4L views"
            />
            <PostCard
              avatarCls="av-b" initials="NS" author="नेहा शर्मा" time="4 घंटे पहले"
              text="RBI ने रेपो रेट घटाया — होम लोन वाले खुश हो जाइए! 🏦💸"
              tag={(financeTag ?? trends[1])?.tag}
              onTag={setActiveTag}
              liked={!!likes.p2} onLike={() => setLikes((l) => ({ ...l, p2: !l.p2 }))}
              likeCount="2.1k" comments="198" shares="950" views="88k views"
            />
            <PostCard
              avatarCls="av-g" initials="AP" author="अर्जुन पटेल" time="6 घंटे पहले"
              text="मुंबई में बारिश शुरू, IMD ने ऑरेंज अलर्ट जारी किया। सावधान रहें! 🌧️"
              tag={(weatherTag ?? trends[2])?.tag}
              onTag={setActiveTag}
              liked={!!likes.p3} onLike={() => setLikes((l) => ({ ...l, p3: !l.p3 }))}
              likeCount="730" comments="89" shares="220" views="32k views"
            />
            <div style={{ height: 10 }} />
          </div>

          <div className="ht-bottom-nav">
            <div className="ht-nav-item active"><div className="ht-nav-icon">🏠</div><span>Home</span></div>
            <div className="ht-nav-item"><div className="ht-nav-icon">🔍</div><span>Explore</span></div>
            <div className="ht-nav-item">
              <div className="ht-nav-icon" style={{ background: "var(--ht-red)", color: "#fff", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>+</div>
            </div>
            <div className="ht-nav-item"><div className="ht-nav-icon">👤</div><span>Profile</span></div>
            <div className="ht-nav-item"><div className="ht-nav-icon">▶</div><span>Videos</span></div>
          </div>
        </div>
      </div>

      <div className={`ht-toast${toast ? " show" : ""}`}>{toast}</div>
      <style>{styles}</style>
    </div>
  );
}

function PostCard(props: {
  avatarCls: string; initials: string; author: string; time: string;
  text: string; tag?: string; onTag: (t: string) => void;
  liked: boolean; onLike: () => void;
  likeCount: string; comments: string; shares: string; views: string;
}) {
  return (
    <div className="ht-post-card">
      <div className="ht-post-header">
        <div className={`ht-avatar ${props.avatarCls}`}>{props.initials}</div>
        <div className="ht-post-meta">
          <div className="ht-post-author">{props.author}</div>
          <div className="ht-post-time">{props.time}</div>
        </div>
        <button className="ht-follow-btn-small">Follow</button>
      </div>
      <div className="ht-post-text">{props.text}</div>
      {props.tag && (
        <div className="ht-post-tags-inline">
          <span className="ht-inline-tag" onClick={() => props.onTag(props.tag!)}>{props.tag}</span>
        </div>
      )}
      <div className="ht-post-actions">
        <div className={`ht-action-btn${props.liked ? " liked" : ""}`} onClick={props.onLike}>
          {props.liked ? "♥" : "♡"} {props.likeCount}
        </div>
        <div className="ht-action-btn">💬 {props.comments}</div>
        <div className="ht-action-btn">↗ {props.shares}</div>
        <div className="ht-views-count">{props.views}</div>
      </div>
    </div>
  );
}

const styles = `
.ht-root {
  font-family: 'Noto Sans Devanagari', system-ui, sans-serif;
  background: var(--ht-bg);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 12px 60px;
  color: var(--ht-ink);
}
.ht-phone-wrap { display:flex; flex-direction:column; align-items:center; gap:10px; }
.ht-phone-label { font-family:'Space Mono',monospace; font-size:10px; color:var(--ht-ink3); letter-spacing:2px; text-transform:uppercase; display:flex; align-items:center; gap:10px; }
.ht-updated-text { text-transform:none; letter-spacing:0; font-family:'Noto Sans Devanagari',sans-serif; color:var(--ht-ink3); }
.ht-refresh-mini { background:var(--ht-ink); color:#fff; border:none; border-radius:50%; width:24px; height:24px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:13px; }
.ht-refresh-mini:hover { background:var(--ht-red); }
.ht-refresh-mini.loading { opacity:.55; pointer-events:none; }
.ht-phone-shell { width:340px; background:#fff; border:1.5px solid var(--ht-ink); border-radius:28px; overflow:hidden; min-height:600px; box-shadow:6px 6px 0 var(--ht-ink); }
.ht-status-bar { background:#fff; padding:8px 18px 4px; display:flex; justify-content:space-between; font-size:11px; font-family:'Space Mono',monospace; color:var(--ht-ink2); }
.ht-top-bar { padding:6px 12px 8px; border-bottom:1px solid var(--ht-border); }
.ht-search-row { display:flex; align-items:center; gap:8px; margin-bottom:6px; }
.ht-logo-badge { background:var(--ht-red); color:#fff; font-size:13px; font-weight:700; border-radius:5px; width:28px; height:28px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.ht-search-bar { flex:1; background:#f5f5f5; border:1px solid var(--ht-border); border-radius:20px; padding:5px 12px; font-size:12px; color:var(--ht-ink3); }
.ht-icon-btn { width:28px; height:28px; display:flex; align-items:center; justify-content:center; font-size:14px; cursor:pointer; color:var(--ht-ink2); }
.ht-nav-tabs { display:flex; overflow-x:auto; gap:0; }
.ht-nav-tabs::-webkit-scrollbar{display:none}
.ht-nav-tab { font-size:12px; font-weight:500; padding:4px 12px 8px; color:var(--ht-ink3); cursor:pointer; white-space:nowrap; border-bottom:2px solid transparent; }
.ht-nav-tab.active { color:var(--ht-red); border-bottom-color:var(--ht-red); }

.ht-feed { overflow-y:auto; max-height:520px; background:#f7f7f7; }
.ht-feed::-webkit-scrollbar{width:3px}
.ht-feed::-webkit-scrollbar-thumb{background:#ddd;border-radius:2px}
.ht-section-divider { background:#fff; margin-bottom:6px; padding:10px 12px 0; }
.ht-trending-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
.ht-trending-label-group { display:flex; align-items:center; gap:6px; }
.ht-fire-dot { width:8px; height:8px; background:#f57c00; border-radius:50%; animation: ht-livepulse 1.4s infinite; }
.ht-trending-title { font-size:13px; font-weight:600; color:var(--ht-ink); }
.ht-trend-count { font-size:10px; color:var(--ht-ink3); font-family:'Space Mono',monospace; background:#f0f0f0; padding:1px 6px; border-radius:8px; }
.ht-see-all-btn { font-size:11px; color:#1565c0; cursor:pointer; }

.ht-tag-pills-scroll { display:flex; gap:6px; overflow-x:auto; padding-bottom:10px; }
.ht-tag-pills-scroll::-webkit-scrollbar{display:none}
.ht-tag-pill { display:flex; align-items:center; gap:4px; background:#f5f5f5; border:1px solid var(--ht-border); border-radius:16px; padding:4px 10px; font-size:11px; color:var(--ht-ink2); white-space:nowrap; cursor:pointer; transition:all .14s; flex-shrink:0; }
.ht-tag-pill.active { background:var(--ht-red-bg); color:var(--ht-red); border-color:#ef9a9a; font-weight:600; }
.ht-pill-rank { font-family:'Space Mono',monospace; font-size:9px; color:var(--ht-ink3); font-weight:700; min-width:10px; }
.ht-tag-pill.active .ht-pill-rank { color:var(--ht-red); }
.ht-pill-emoji { font-size:11px; }

.ht-topic-card { background:#fff; margin-bottom:6px; padding:12px; border-left:3px solid var(--ht-red); animation: ht-fadeUp .25s ease both; }
.ht-topic-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:6px; }
.ht-topic-head-left { display:flex; align-items:center; gap:8px; }
.ht-topic-rank { font-family:'Space Mono',monospace; font-size:11px; font-weight:700; background:var(--ht-red); color:#fff; padding:2px 6px; border-radius:4px; }
.ht-topic-tag { font-size:14px; font-weight:700; color:var(--ht-red); }
.ht-topic-desc { font-size:12px; color:var(--ht-ink2); line-height:1.5; margin-bottom:10px; }
.ht-clear-filter-btn { font-size:13px; color:var(--ht-ink3); cursor:pointer; padding:2px 6px; line-height:1; }

.ht-topic-meta-row { display:flex; align-items:center; gap:6px; flex-wrap:wrap; margin-bottom:10px; }
.ht-category-chip { font-size:10px; font-weight:600; padding:2px 8px; border-radius:3px; white-space:nowrap; text-transform:capitalize; }
.ht-cat-sports { background:#e3f2fd; color:#0d47a1; }
.ht-cat-news { background:#fff3e0; color:#bf360c; }
.ht-cat-entertainment { background:#f3e5f5; color:#6a1b9a; }
.ht-cat-weather { background:#e8f5e9; color:#1b5e20; }
.ht-cat-finance { background:#fffde7; color:#f57f17; }
.ht-cat-technology { background:#fce4ec; color:#880e4f; }
.ht-cat-politics { background:#efebe9; color:#3e2723; }
.ht-cat-religion { background:#fff8e1; color:#e65100; }
.ht-cat-lifestyle { background:#e8eaf6; color:#283593; }
.ht-cat-health { background:#e0f2f1; color:#004d40; }
.ht-heat-badge { font-size:10px; font-weight:600; color:#e65100; background:#fff3e0; padding:2px 7px; border-radius:3px; }
.ht-source-badge { font-size:10px; color:var(--ht-ink3); background:#f5f5f5; padding:2px 7px; border-radius:3px; }

.ht-heat-bar-wrap { margin-bottom:12px; }
.ht-heat-bar-label { font-size:9px; color:var(--ht-ink3); font-family:'Space Mono',monospace; letter-spacing:.5px; margin-bottom:4px; text-transform:uppercase; }
.ht-heat-bar-track { height:4px; background:#f0f0f0; border-radius:2px; overflow:hidden; }
.ht-heat-bar-fill { height:100%; background:linear-gradient(90deg, #ff9800, var(--ht-red)); border-radius:2px; transition:width .6s ease; }

.ht-topic-related-head { font-size:11px; font-weight:700; color:var(--ht-ink3); letter-spacing:.5px; text-transform:uppercase; margin:0 0 8px; }
.ht-related-post-card { background:#fafafa; border:1px solid var(--ht-border); border-radius:10px; padding:10px; margin-bottom:10px; }
.ht-related-head-row { display:flex; align-items:center; gap:6px; margin-bottom:8px; }
.ht-related-meta { display:flex; flex-direction:column; line-height:1.1; min-width:0; flex:1; }
.ht-related-name { font-size:11px; font-weight:700; color:var(--ht-ink); }
.ht-related-sub { font-size:9px; color:var(--ht-ink3); }
.ht-related-post-text { font-size:12px; color:var(--ht-ink); line-height:1.6; margin-bottom:8px; }
.ht-related-tags-row { display:flex; gap:6px; margin-bottom:8px; }

.ht-summary-trigger { width:100%; background:none; border:1px dashed #1565c0; color:#1565c0; font-size:11px; padding:7px; border-radius:6px; cursor:pointer; font-family:'Noto Sans Devanagari',sans-serif; }
.ht-summary-trigger:hover { background:#e3f2fd; }
.ht-topic-summary { margin-top:10px; padding:10px; background:var(--ht-red-bg); border-radius:6px; }
.ht-summary-head { font-size:11px; font-weight:700; color:var(--ht-red); margin-bottom:4px; letter-spacing:.5px; text-transform:uppercase; }
.ht-summary-text { font-size:12px; color:var(--ht-ink); line-height:1.6; }
.ht-summary-loading { font-size:11px; color:var(--ht-ink3); font-family:'Space Mono',monospace; display:flex; align-items:center; gap:6px; }

.ht-post-card { background:#fff; margin-bottom:6px; padding:10px 12px 0; }
.ht-post-header { display:flex; align-items:center; gap:8px; margin-bottom:8px; }
.ht-avatar { width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:600; flex-shrink:0; }
.ht-avatar.av-o { background:#fff3e0; color:#e65100; }
.ht-avatar.av-b { background:#e3f2fd; color:#1565c0; }
.ht-avatar.av-g { background:#e8f5e9; color:#2e7d32; }
.ht-avatar.av-p { background:#f3e5f5; color:#6a1b9a; }
.ht-post-meta { flex:1; }
.ht-post-author { font-size:12px; font-weight:600; color:var(--ht-ink); }
.ht-post-time { font-size:10px; color:var(--ht-ink3); }
.ht-follow-btn-small { font-size:10px; border:1px solid #1565c0; color:#1565c0; background:transparent; border-radius:10px; padding:2px 8px; cursor:pointer; white-space:nowrap; }
.ht-post-text { font-size:13px; line-height:1.6; color:var(--ht-ink); margin-bottom:8px; }
.ht-post-tags-inline { display:flex; flex-wrap:wrap; gap:4px; margin-bottom:8px; }
.ht-inline-tag { font-size:10px; color:#1565c0; cursor:pointer; }
.ht-post-actions { display:flex; align-items:center; gap:16px; padding:6px 0 8px; border-top:1px solid #f0f0f0; }
.ht-action-btn { display:flex; align-items:center; gap:4px; font-size:11px; color:var(--ht-ink3); cursor:pointer; }
.ht-action-btn.liked { color:var(--ht-red); }
.ht-views-count { margin-left:auto; font-size:10px; color:var(--ht-ink3); }

.ht-bottom-nav { background:#fff; border-top:1px solid var(--ht-border); display:flex; justify-content:space-around; align-items:center; padding:8px 0 12px; }
.ht-nav-item { display:flex; flex-direction:column; align-items:center; gap:2px; font-size:9px; color:var(--ht-ink3); cursor:pointer; }
.ht-nav-item.active { color:var(--ht-red); }
.ht-nav-icon { font-size:18px; }

.ht-spin { display:inline-block; animation: ht-spin .8s linear infinite; }
.ht-toast { position:fixed; bottom:24px; left:50%; transform:translateX(-50%); background:var(--ht-ink); color:#fff; font-size:12px; padding:8px 20px; border-radius:4px; box-shadow:4px 4px 0 var(--ht-red); opacity:0; pointer-events:none; transition:opacity .2s; z-index:200; white-space:nowrap; }
.ht-toast.show { opacity:1; }
`;

export default HindiTrendsPage;
