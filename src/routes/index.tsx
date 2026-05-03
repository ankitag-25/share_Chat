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
const getCatClass = (c?: string) => catClass[c?.toLowerCase() ?? ""] ?? "ht-cat-news";

const TRENDING_LABEL = "आज की हलचल";

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
  const [topicImages, setTopicImages] = useState<string[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summary, setSummary] = useState<string>("");
  const [summaryLoading, setSummaryLoading] = useState(false);

  const [lastUpdated, setLastUpdated] = useState("");
  useEffect(() => {
    try {
      setLastUpdated(
        new Date(fetchedAt).toLocaleTimeString("hi-IN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    } catch {
      /* noop */
    }
  }, [fetchedAt]);

  useEffect(() => {
    const tick = () => {
      const n = new Date();
      setClock(
        `${n.getHours().toString().padStart(2, "0")}:${n.getMinutes().toString().padStart(2, "0")}`,
      );
    };
    tick();
    const id = setInterval(tick, 10000);
    return () => clearInterval(id);
  }, []);

  // Auto-refresh trends every 3 minutes so tags keep changing
  useEffect(() => {
    const id = setInterval(() => {
      void refresh(true);
    }, 3 * 60 * 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const sportsTag = trends.find((t) =>
    ["sports", "cricket"].includes(t.category?.toLowerCase()),
  );
  const financeTag = trends.find((t) =>
    ["finance", "economy"].includes(t.category?.toLowerCase()),
  );
  const weatherTag = trends.find((t) => t.category?.toLowerCase() === "weather");
  const activeItem = trends.find((t) => t.tag === activeTag) ?? null;

  useEffect(() => {
    if (!activeItem) {
      setTopicImages([]);
      setSummaryOpen(false);
      setSummary("");
      return;
    }
    let cancelled = false;
    setImagesLoading(true);
    setTopicImages([]);
    setSummaryOpen(false);
    setSummary("");
    getTopicImages({
      data: {
        tag: activeItem.tag,
        description: activeItem.description,
        category: activeItem.category,
      },
    })
      .then((r) => {
        if (!cancelled) setTopicImages(r.images);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setImagesLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeItem?.tag]);

  async function loadSummary() {
    if (!activeItem) return;
    setSummaryOpen(true);
    if (summary) return;
    setSummaryLoading(true);
    try {
      const r = await getTopicSummary({
        data: { tag: activeItem.tag, description: activeItem.description },
      });
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
            {error
              ? "एरर"
              : loading
                ? "अपडेट हो रहा है..."
                : lastUpdated
                  ? `${lastUpdated} पर अपडेट`
                  : ""}
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
              <div className="ht-section-divider">
                <div className="ht-trending-header">
                  <div className="ht-trending-label-group">
                    <div className="ht-fire-dot" />
                    <span className="ht-trending-title">{TRENDING_LABEL}</span>
                  </div>
                  {activeItem && (
                    <div className="ht-see-all-btn" onClick={loadSummary}>
                      और देखें →
                    </div>
                  )}
                </div>
                <div className="ht-tag-pills-scroll">
                  {trends.slice(0, 8).map((item) => (
                    <div
                      key={item.tag}
                      className={`ht-tag-pill${item.tag === activeTag ? " active" : ""}`}
                      onClick={() =>
                        setActiveTag((cur) => (cur === item.tag ? null : item.tag))
                      }
                    >
                      {item.tag}
                    </div>
                  ))}
                </div>
              </div>

              {activeItem && (
                <div className="ht-topic-card">
                  <div className="ht-topic-head">
                    <span className="ht-topic-tag">{activeItem.tag}</span>
                    <span
                      className="ht-clear-filter-btn"
                      onClick={() => setActiveTag(null)}
                    >
                      ✕
                    </span>
                  </div>
                  <div className="ht-topic-desc">{activeItem.description}</div>
                  <div className="ht-topic-related-head">संबंधित पोस्ट</div>
                  <div className="ht-topic-related">
                    {imagesLoading &&
                      [0, 1].map((i) => (
                        <div key={i} className="ht-related-card">
                          <div className="ht-related-head-row">
                            <div className="ht-avatar av-skel" />
                            <div className="ht-related-meta-skel" />
                          </div>
                          <div className="ht-topic-img ht-topic-img-skel" />
                        </div>
                      ))}
                    {!imagesLoading &&
                      topicImages.slice(0, 2).map((src, i) => {
                        const accounts = [
                          { initials: "PS", name: "प्रिया सिंह", handle: "@priya_news", time: "1 घं", av: "av-o" },
                          { initials: "VM", name: "विकास मेहता", handle: "@vikas_live", time: "3 घं", av: "av-b" },
                        ];
                        const a = accounts[i];
                        return (
                          <div key={i} className="ht-related-card">
                            <div className="ht-related-head-row">
                              <div className={`ht-avatar ${a.av}`}>{a.initials}</div>
                              <div className="ht-related-meta">
                                <div className="ht-related-name">{a.name}</div>
                                <div className="ht-related-sub">{a.handle} · {a.time}</div>
                              </div>
                            </div>
                            <img src={src} alt={activeItem.tag} className="ht-topic-img" />
                            <div className="ht-related-caption">
                              {activeItem.tag} पर ताज़ा अपडेट 👇
                            </div>
                          </div>
                        );
                      })}
                    {!imagesLoading && topicImages.length === 0 && (
                      <div className="ht-topic-img ht-topic-img-empty">
                        छवि उपलब्ध नहीं
                      </div>
                    )}
                  </div>
                  {summaryOpen && (
                    <div className="ht-topic-summary">
                      <div className="ht-summary-head">सारांश</div>
                      {summaryLoading ? (
                        <div className="ht-summary-loading">लोड हो रहा है...</div>
                      ) : (
                        <div className="ht-summary-text">{summary}</div>
                      )}
                    </div>
                  )}
                </div>
              )}


              <PostCard
                avatarCls="av-o"
                initials="RK"
                author="राजेश कुमार"
                time="2 घंटे पहले"
                text="भारत-ऑस्ट्रेलिया मैच में रोमांच चरम पर, आखिरी ओवर में सब कुछ बदल गया! 🏏"
                tag={(sportsTag ?? trends[0])?.tag}
                onTag={setActiveTag}
                liked={!!likes.p1}
                onLike={() => setLikes((l) => ({ ...l, p1: !l.p1 }))}
                likeCount="4.3k"
                comments="312"
                shares="1.9k"
                views="1.4L views"
              />
              <PostCard
                avatarCls="av-b"
                initials="NS"
                author="नेहा शर्मा"
                time="4 घंटे पहले"
                text="RBI ने रेपो रेट घटाया — होम लोन वाले खुश हो जाइए! 🏦💸"
                tag={(financeTag ?? trends[1])?.tag}
                onTag={setActiveTag}
                liked={!!likes.p2}
                onLike={() => setLikes((l) => ({ ...l, p2: !l.p2 }))}
                likeCount="2.1k"
                comments="198"
                shares="950"
                views="88k views"
              />
              <PostCard
                avatarCls="av-g"
                initials="AP"
                author="अर्जुन पटेल"
                time="6 घंटे पहले"
                text="मुंबई में बारिश शुरू, IMD ने ऑरेंज अलर्ट जारी किया। सावधान रहें! 🌧️"
                tag={(weatherTag ?? trends[2])?.tag}
                onTag={setActiveTag}
                liked={!!likes.p3}
                onLike={() => setLikes((l) => ({ ...l, p3: !l.p3 }))}
                likeCount="730"
                comments="89"
                shares="220"
                views="32k views"
              />
              <div style={{ height: 10 }} />
            </div>

            <div className="ht-bottom-nav">
              <div className="ht-nav-item active"><div className="ht-nav-icon">🏠</div><span>Home</span></div>
              <div className="ht-nav-item"><div className="ht-nav-icon">🔍</div><span>Explore</span></div>
              <div className="ht-nav-item">
                <div
                  className="ht-nav-icon"
                  style={{
                    background: "var(--ht-red)",
                    color: "#fff",
                    borderRadius: "50%",
                    width: 32,
                    height: 32,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  +
                </div>
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
  avatarCls: string;
  initials: string;
  author: string;
  time: string;
  text: string;
  tag?: string;
  onTag: (t: string) => void;
  liked: boolean;
  onLike: () => void;
  likeCount: string;
  comments: string;
  shares: string;
  views: string;
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
          <span className="ht-inline-tag" onClick={() => props.onTag(props.tag!)}>
            {props.tag}
          </span>
        </div>
      )}
      <div className="ht-post-actions">
        <div
          className={`ht-action-btn${props.liked ? " liked" : ""}`}
          onClick={props.onLike}
        >
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
.ht-page-header { width:100%; max-width:1060px; display:flex; align-items:center; justify-content:space-between; padding:0 4px 16px; border-bottom:2px solid var(--ht-ink); margin-bottom:24px; }
.ht-logo-group { display:flex; align-items:baseline; gap:10px; }
.ht-logo-hi { font-size:26px; font-weight:700; color:var(--ht-red); line-height:1; letter-spacing:-1px; }
.ht-logo-label { font-family:'Space Mono',monospace; font-size:10px; color:var(--ht-ink3); letter-spacing:2px; text-transform:uppercase; }
.ht-refresh-btn { display:flex; align-items:center; gap:7px; background:var(--ht-ink); color:#fff; border:none; border-radius:4px; padding:8px 16px; font-size:12px; font-weight:600; cursor:pointer; transition:background .15s, transform .1s; }
.ht-refresh-btn:hover { background:var(--ht-red); transform:translateY(-1px); }
.ht-refresh-btn.loading { opacity:.55; pointer-events:none; }
.ht-spin { display:inline-block; animation: ht-spin .8s linear infinite; }

.ht-main-layout { width:100%; max-width:1060px; display:grid; grid-template-columns:1fr; gap:20px; }
@media (min-width:820px) { .ht-main-layout { grid-template-columns:1fr 360px; align-items:start; } }

.ht-trending-panel { background:var(--ht-card); border:1.5px solid var(--ht-ink); border-radius:6px; overflow:hidden; }
.ht-panel-head { display:flex; align-items:center; justify-content:space-between; padding:12px 16px; background:var(--ht-ink); color:#fff; }
.ht-panel-title { font-size:13px; font-weight:700; letter-spacing:.5px; display:flex; align-items:center; gap:8px; }
.ht-live-dot { width:7px; height:7px; background:#4caf50; border-radius:50%; animation: ht-livepulse 1.6s ease-in-out infinite; }
.ht-panel-meta { font-size:10px; color:rgba(255,255,255,.55); font-family:'Space Mono',monospace; }

.ht-sources-strip { display:flex; gap:6px; padding:8px 16px; background:#fafafa; border-bottom:1px solid var(--ht-border); flex-wrap:wrap; }
.ht-src-chip { display:flex; align-items:center; gap:4px; font-size:10px; color:var(--ht-ink3); font-family:'Space Mono',monospace; }
.ht-src-pip { width:6px; height:6px; border-radius:50%; }
.ht-sp-live { background:#4caf50; animation: ht-livepulse 1.8s infinite; }
.ht-sp-ai { background:var(--ht-red); animation: ht-livepulse 1.8s .3s infinite; }

.ht-trend-list { list-style:none; margin:0; padding:0; }
.ht-trend-item { display:grid; grid-template-columns:36px 1fr; align-items:start; gap:0 14px; padding:14px 16px; border-bottom:1px solid var(--ht-border); cursor:pointer; transition:background .12s; position:relative; animation: ht-fadeUp .35s ease both; }
.ht-trend-item:last-child { border-bottom:none; }
.ht-trend-item:hover { background:#fafafa; }
.ht-trend-item.active { background:var(--ht-red-bg); }
.ht-trend-rank { font-family:'Space Mono',monospace; font-size:20px; font-weight:700; color:var(--ht-border); line-height:1; padding-top:2px; transition:color .2s; text-align:right; }
.ht-trend-item:hover .ht-trend-rank { color:var(--ht-ink3); }
.ht-trend-item.active .ht-trend-rank { color:var(--ht-red); }
.ht-trend-rank.r1 { color:#f57c00 !important; }
.ht-trend-rank.r2 { color:#9e9e9e; }
.ht-trend-rank.r3 { color:#a1887f; }
.ht-trend-body { min-width:0; }
.ht-trend-tag { font-size:14px; font-weight:700; color:var(--ht-ink); margin-bottom:3px; word-break:break-word; }
.ht-trend-item.active .ht-trend-tag { color:var(--ht-red); }
.ht-trend-desc { font-size:12px; color:var(--ht-ink3); line-height:1.5; margin-bottom:6px; }
.ht-trend-meta-row { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
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
.ht-source-tag { font-size:10px; color:var(--ht-ink3); font-family:'Space Mono',monospace; }

.ht-error-state { padding:32px 20px; text-align:center; color:var(--ht-ink3); font-size:13px; line-height:1.6; }
.ht-err-icon { font-size:28px; margin-bottom:10px; }
.ht-retry-link { color:var(--ht-red); cursor:pointer; text-decoration:underline; font-weight:600; }
.ht-sk-item { padding:16px; border-bottom:1px solid var(--ht-border); }
.ht-sk-bar { height:14px; border-radius:3px; background:linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%); background-size:200% 100%; animation: ht-shimmer 1.2s infinite; margin-bottom:8px; }

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

.ht-feed { overflow-y:auto; max-height:460px; background:#f7f7f7; }
.ht-feed::-webkit-scrollbar{width:3px}
.ht-feed::-webkit-scrollbar-thumb{background:#ddd;border-radius:2px}
.ht-section-divider { background:#fff; margin-bottom:6px; padding:10px 12px 0; }
.ht-trending-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
.ht-trending-label-group { display:flex; align-items:center; gap:6px; }
.ht-fire-dot { width:8px; height:8px; background:#f57c00; border-radius:50%; animation: ht-livepulse 1.4s infinite; }
.ht-trending-title { font-size:13px; font-weight:600; color:var(--ht-ink); }
.ht-see-all-btn { font-size:11px; color:#1565c0; cursor:pointer; }

.ht-tag-pills-scroll { display:flex; gap:6px; overflow-x:auto; padding-bottom:10px; }
.ht-tag-pills-scroll::-webkit-scrollbar{display:none}
.ht-tag-pill { display:flex; align-items:center; gap:4px; background:#f5f5f5; border:1px solid var(--ht-border); border-radius:16px; padding:4px 10px; font-size:11px; color:var(--ht-ink2); white-space:nowrap; cursor:pointer; transition:all .14s; flex-shrink:0; }
.ht-tag-pill.active { background:var(--ht-red-bg); color:var(--ht-red); border-color:#ef9a9a; font-weight:600; }

.ht-filter-banner { background:var(--ht-red-bg); border-bottom:1px solid #ef9a9a; padding:6px 12px; display:flex; align-items:center; justify-content:space-between; }
.ht-filter-banner-text { font-size:11px; color:var(--ht-red); font-weight:600; }
.ht-clear-filter-btn { font-size:13px; color:var(--ht-ink3); cursor:pointer; padding:2px 6px; line-height:1; }

.ht-topic-card { background:#fff; margin-bottom:6px; padding:12px; border-left:3px solid var(--ht-red); animation: ht-fadeUp .25s ease both; }
.ht-topic-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:6px; }
.ht-topic-tag { font-size:14px; font-weight:700; color:var(--ht-red); }
.ht-topic-desc { font-size:12px; color:var(--ht-ink2); line-height:1.5; margin-bottom:10px; }
.ht-topic-images { display:grid; grid-template-columns:1fr 1fr; gap:6px; }
.ht-topic-img { width:100%; aspect-ratio:1/1; object-fit:cover; border-radius:8px; background:#eee; display:block; }
.ht-topic-img-skel { background:linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%); background-size:200% 100%; animation: ht-shimmer 1.2s infinite; }
.ht-topic-img-empty { display:flex; align-items:center; justify-content:center; font-size:11px; color:var(--ht-ink3); grid-column:1/-1; aspect-ratio:auto; padding:18px; }
.ht-topic-related-head { font-size:11px; font-weight:700; color:var(--ht-ink3); letter-spacing:.5px; text-transform:uppercase; margin:10px 0 6px; }
.ht-topic-related { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
.ht-related-card { background:#fff; border:1px solid var(--ht-border); border-radius:10px; padding:8px; display:flex; flex-direction:column; gap:6px; }
.ht-related-head-row { display:flex; align-items:center; gap:6px; }
.ht-related-meta { display:flex; flex-direction:column; line-height:1.1; min-width:0; }
.ht-related-name { font-size:11px; font-weight:700; color:var(--ht-ink); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.ht-related-sub { font-size:9px; color:var(--ht-ink3); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.ht-related-meta-skel { flex:1; height:18px; border-radius:4px; background:linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%); background-size:200% 100%; animation: ht-shimmer 1.2s infinite; }
.av-skel { background:linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%); background-size:200% 100%; animation: ht-shimmer 1.2s infinite; color:transparent; }
.ht-related-caption { font-size:11px; color:var(--ht-ink2,#444); line-height:1.3; }
.ht-topic-summary { margin-top:10px; padding:10px; background:var(--ht-red-bg); border-radius:6px; }
.ht-summary-head { font-size:11px; font-weight:700; color:var(--ht-red); margin-bottom:4px; letter-spacing:.5px; text-transform:uppercase; }
.ht-summary-text { font-size:12px; color:var(--ht-ink); line-height:1.6; }
.ht-summary-loading { font-size:11px; color:var(--ht-ink3); font-family:'Space Mono',monospace; }


.ht-post-card { background:#fff; margin-bottom:6px; padding:10px 12px 0; }
.ht-post-header { display:flex; align-items:center; gap:8px; margin-bottom:8px; }
.ht-avatar { width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:600; flex-shrink:0; }
.ht-avatar.av-o { background:#fff3e0; color:#e65100; }
.ht-avatar.av-b { background:#e3f2fd; color:#1565c0; }
.ht-avatar.av-g { background:#e8f5e9; color:#2e7d32; }
.ht-post-meta { flex:1; }
.ht-post-author { font-size:12px; font-weight:600; color:var(--ht-ink); }
.ht-post-time { font-size:10px; color:var(--ht-ink3); }
.ht-follow-btn-small { font-size:10px; border:1px solid #1565c0; color:#1565c0; background:transparent; border-radius:10px; padding:2px 8px; cursor:pointer; }
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

.ht-toast { position:fixed; bottom:24px; left:50%; transform:translateX(-50%); background:var(--ht-ink); color:#fff; font-size:12px; padding:8px 20px; border-radius:4px; box-shadow:4px 4px 0 var(--ht-red); opacity:0; pointer-events:none; transition:opacity .2s; z-index:200; white-space:nowrap; }
.ht-toast.show { opacity:1; }
`;

export default HindiTrendsPage;
