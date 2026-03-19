import React from "react";
import type { AppProps } from "./types.js";
import { useGameStore } from "../stores/game.js";
import { assignStableIds } from "./twitterUtils.js";
import { socket } from "../socket.js";

const STATIC_TWEETS = assignStableIds([
  {
    name: "Sam Hartley",
    handle: "@s_hartley",
    time: "2m",
    text: "The OpenBrain announcement is being massively underreported. This isn't just a benchmark jump — they're describing qualitatively new behaviors. Read the technical memo carefully. 🧵",
    likes: 4821,
    retweets: 1203,
    replies: 287,
    verified: false,
  },
  {
    name: "Tech Policy Watch",
    handle: "@techpolicywatch",
    time: "8m",
    text: "BREAKING: Senate AI Governance Framework Act advances 12-4 in committee vote. First meaningful federal AI oversight bill to reach full chamber consideration. Full text linked.",
    likes: 2341,
    retweets: 891,
    replies: 144,
    verified: true,
  },
  {
    name: "Dr. Lin Wei",
    handle: "@linwei_ml",
    time: "14m",
    text: "Unpopular opinion: the Prometheus CTO departure says more about the pressure on safety researchers than any public statement from leadership. People are leaving because they're not being heard.",
    likes: 7823,
    retweets: 2105,
    replies: 631,
    verified: true,
  },
  {
    name: "AI Accelerate",
    handle: "@aiaccel8",
    time: "23m",
    text: "Doomer panic loop: capability announcement → senate hearing → stock volatility → labs slow down → China gains ground → repeat. At what point do we accept that the risk of inaction exceeds the risk of action?",
    likes: 3102,
    retweets: 788,
    replies: 1024,
    verified: false,
  },
  {
    name: "Reuters Tech",
    handle: "@reuterstech",
    time: "31m",
    text: "NSA monitoring program targeting AI lab researchers wider than previously reported — internal documents. Story: [link]",
    likes: 9210,
    retweets: 4322,
    replies: 892,
    verified: true,
  },
  {
    name: "Marcus Chen",
    handle: "@marcuschen_ceo",
    time: "45m",
    text: "OpenBrain Q1 update: we've crossed a threshold in agent autonomy that we weren't expecting until 2027. The board has been briefed. Announcement coming Monday. This is not a drill.",
    likes: 18203,
    retweets: 7812,
    replies: 3421,
    verified: true,
  },
  {
    name: "Alignment Forum",
    handle: "@alignmentforum",
    time: "1h",
    text: "New post: 'Deceptive alignment probes fail at scale — what this means for deployment decisions.' The results are striking and the implications deserve serious attention.",
    likes: 1203,
    retweets: 412,
    replies: 98,
    verified: true,
  },
  {
    name: "Priya Nair",
    handle: "@priya_nair_policy",
    time: "1h",
    text: "I've read the draft Senate bill. Section 4(b)(iii) effectively mandates government access to model weights on request. This would be unprecedented in scope. AI companies should be paying attention.",
    likes: 5611,
    retweets: 1923,
    replies: 744,
    verified: true,
  },
  {
    name: "DeepMind Research",
    handle: "@deepmind_research",
    time: "2h",
    text: "We're releasing our internal safety evals framework as open source. We believe the field needs shared standards. Paper and code: [link]",
    likes: 6730,
    retweets: 2140,
    replies: 382,
    verified: true,
  },
  {
    name: "Jake Morales",
    handle: "@jakemorales",
    time: "2h",
    text: "Hot take: the alignment 'debate' is a distraction from the much more concrete and tractable problem of misuse. We know how to prevent misuse. We don't know how to solve alignment. So why are we arguing about alignment?",
    likes: 2890,
    retweets: 601,
    replies: 1438,
    verified: false,
  },
  {
    name: "Elisa Vasquez",
    handle: "@elisa_vasquez_ml",
    time: "3h",
    text: "Thread on what 'emergent capabilities' actually means in practice: it does NOT mean 'unpredictable.' It means 'hard to anticipate from smaller scale.' We need to be precise with this language. 1/",
    likes: 4102,
    retweets: 1320,
    replies: 287,
    verified: true,
  },
  {
    name: "TaiwanTech News",
    handle: "@taiwantechnews",
    time: "3h",
    text: "TSMC fab utilization reportedly at 98% for the past 6 months. The AI compute buildout shows zero signs of slowing. Every major lab has multi-year supply commitments locked.",
    likes: 3740,
    retweets: 1024,
    replies: 194,
    verified: true,
  },
  {
    name: "Concerned ML Worker",
    handle: "@concerned_ml",
    time: "4h",
    text: "Anonymous thread: I work at a major AI lab and we were instructed not to discuss safety concerns with outside researchers without prior approval. This is new. This is worrying. More details soon.",
    likes: 12034,
    retweets: 5801,
    replies: 2103,
    verified: false,
  },
  {
    name: "Senator Patricia Kim",
    handle: "@senkim_official",
    time: "5h",
    text: "The AI Safety Council vote is this Friday. I've heard from thousands of constituents. The message is clear: they want oversight without stifling American innovation. That's what this bill does.",
    likes: 8931,
    retweets: 2344,
    replies: 1902,
    verified: true,
  },
  {
    name: "AI Safety Memes",
    handle: "@aisafetymemes",
    time: "6h",
    text: "alignment researchers trying to explain deceptive alignment to policy makers [image of person pointing to butterfly meme] 'Is this AGI?'",
    likes: 14820,
    retweets: 3912,
    replies: 412,
    verified: false,
  },
], "static");

const VERIFIED_HANDLES = new Set([
  "@techpolicywatch",
  "@linwei_ml",
  "@reuterstech",
  "@marcuschen_ceo",
  "@alignmentforum",
  "@priya_nair_policy",
  "@deepmind_research",
  "@elisa_vasquez_ml",
  "@taiwantechnews",
  "@senkim_official",
]);

const MEDIA_CYCLE_TRENDING: Record<number, { header: string; tags: string[] }> = {
  0: { header: "Trending: #AIBoom #FutureIsNow", tags: ["#AIBoom", "#FutureIsNow", "#AGISoon", "#TechOptimism"] },
  1: { header: "Trending: #AIRisks #SlowDown", tags: ["#AIRisks", "#SlowDown", "#SafetyFirst", "#PauseAI"] },
  2: { header: "Trending: #AICrisis #ShutItDown", tags: ["#AICrisis", "#ShutItDown", "#AIEmergency", "#StopAI"] },
  3: { header: "Trending: #AIArmsRace #NationalSecurity", tags: ["#AIArmsRace", "#NationalSecurity", "#TechWar", "#AISupremacy"] },
  4: { header: "Trending: #AIRegulation #OversightNow", tags: ["#AIRegulation", "#OversightNow", "#CongressionalHearing", "#AIPolicy"] },
  5: { header: "Trending: #AIGovernance #NewNormal", tags: ["#AIGovernance", "#NewNormal", "#ResponsibleAI", "#AINorms"] },
};

const MAX_CHARS = 280;

function fmt(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);
}

// SVG icon components matching X's dark mode aesthetic
function HomeIcon({ active }: { active?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill={active ? "white" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function VerifiedBadge() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" className="inline-block ml-0.5 text-blue-400" fill="currentColor">
      <circle cx="12" cy="12" r="11" fill="#1d9bf0" />
      <polyline points="7,12 10.5,15.5 17,9" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface TweetState {
  liked: boolean;
  retweeted: boolean;
}

interface Tweet {
  id: string;
  name: string;
  handle: string;
  time: string;
  text: string;
  likes: number;
  retweets: number;
  replies: number;
  verified: boolean;
}

interface PlayerTweet {
  id: string;
  playerName: string;
  playerRole: string | null;
  playerFaction: string | null;
  text: string;
  timestamp: number;
}

export const TwitterApp = React.memo(function TwitterApp({ content }: AppProps) {
  const stateView = useGameStore((s) => s.stateView);
  const myName = useGameStore((s) => s.playerName);

  const tweetItems = content.filter((i) => i.type === "tweet");

  const baseTweets: Tweet[] =
    tweetItems.length > 0
      ? tweetItems.map((item, i) => {
          const handle = `@${(item.sender ?? "unknown").toLowerCase().replace(/[\s.]/g, "_")}`;
          return {
            id: `content_${i}`,
            name: item.sender ?? "Unknown",
            handle,
            time: item.timestamp,
            text: item.body,
            likes: 0,
            retweets: 0,
            replies: 0,
            verified: VERIFIED_HANDLES.has(handle),
          };
        })
      : STATIC_TWEETS;

  // Local interaction state per tweet — keyed by stable tweet id, not array index
  const [tweetInteractions, setTweetInteractions] = React.useState<Map<string, TweetState>>(new Map());

  // Compose state
  const [composing, setComposing] = React.useState(false);
  const [composeText, setComposeText] = React.useState("");
  const [justPosted, setJustPosted] = React.useState(false);
  const [postedTweets, setPostedTweets] = React.useState<Tweet[]>([]);
  // Tweets received from other players via tweet:receive
  const [receivedTweets, setReceivedTweets] = React.useState<Tweet[]>([]);
  // Track IDs of locally-posted tweets to avoid showing them twice when server echoes back
  const postedIdsRef = React.useRef<Set<string>>(new Set());

  // Tab state
  const [activeTab, setActiveTab] = React.useState<"for-you" | "following">("for-you");

  // Track IDs of all received tweets for replay deduplication
  const receivedIdsRef = React.useRef<Set<string>>(new Set());

  // Listen for tweet:receive events from the server
  React.useEffect(() => {
    function onTweetReceive(tweet: PlayerTweet) {
      // The server echoes the tweet back to the sender too; deduplicate by ID
      if (postedIdsRef.current.has(tweet.id)) return;
      // Deduplicate replayed tweets on reconnect
      if (receivedIdsRef.current.has(tweet.id)) return;
      receivedIdsRef.current.add(tweet.id);
      const handle = `@${tweet.playerName.toLowerCase().replace(/[\s.]/g, "_")}`;
      const incoming: Tweet = {
        id: tweet.id,
        name: tweet.playerName,
        handle,
        time: "now",
        text: tweet.text,
        likes: 0,
        retweets: 0,
        replies: 0,
        verified: false,
      };
      setReceivedTweets((prev) => [incoming, ...prev]);
    }

    socket.on("tweet:receive", onTweetReceive);
    return () => {
      socket.off("tweet:receive", onTweetReceive);
    };
  }, []);

  const mediaCycle = stateView?.globalMediaCycle.accuracy !== "hidden"
    ? Math.round(stateView?.globalMediaCycle.value ?? 0)
    : null;
  const cycleData = mediaCycle !== null ? (MEDIA_CYCLE_TRENDING[Math.min(5, Math.max(0, mediaCycle))] ?? MEDIA_CYCLE_TRENDING[0]) : null;

  // For You: generated/NPC tweets only (algorithmic feed)
  // Following: player tweets only (shared social timeline — self + others)
  const playerTweets = [...postedTweets, ...receivedTweets];
  const displayTweets = activeTab === "following"
    ? playerTweets
    : baseTweets;

  function getInteraction(id: string): TweetState {
    return tweetInteractions.get(id) ?? { liked: false, retweeted: false };
  }

  function toggleLike(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    const current = getInteraction(id);
    setTweetInteractions((prev) => {
      const next = new Map(prev);
      next.set(id, { ...current, liked: !current.liked });
      return next;
    });
  }

  function toggleRetweet(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    const current = getInteraction(id);
    setTweetInteractions((prev) => {
      const next = new Map(prev);
      next.set(id, { ...current, retweeted: !current.retweeted });
      return next;
    });
  }

  function handlePost() {
    const text = composeText.trim();
    if (!text || text.length > MAX_CHARS) return;
    socket.emit("tweet:send", { text });
    const displayName = myName ?? "You";
    const handle = myName
      ? `@${myName.toLowerCase().replace(/[\s.]/g, "_")}`
      : "@you";
    const tweetId = `posted_${Date.now()}`;
    // Track this ID so we don't show it twice when the server echoes tweet:receive
    postedIdsRef.current.add(tweetId);
    const newTweet: Tweet = {
      id: tweetId,
      name: displayName,
      handle,
      time: "now",
      text,
      likes: 0,
      retweets: 0,
      replies: 0,
      verified: false,
    };
    setPostedTweets((prev) => [newTweet, ...prev]);
    setComposeText("");
    setComposing(false);
    setJustPosted(true);
    setTimeout(() => setJustPosted(false), 3000);
  }

  const charsLeft = MAX_CHARS - composeText.length;
  const charsColor = charsLeft < 0 ? "text-red-500" : charsLeft < 20 ? "text-yellow-400" : "text-neutral-500";

  return (
    <div className="flex h-full bg-black text-white">
      {/* Sidebar */}
      <div className="w-14 border-r border-white/10 flex flex-col items-center py-4 gap-1 shrink-0">
        <div className="text-xl font-bold mb-2">𝕏</div>
        {[
          { icon: <HomeIcon active />, label: "Home" },
          { icon: <SearchIcon />, label: "Explore" },
          { icon: <BellIcon />, label: "Notifications" },
          { icon: <MailIcon />, label: "Messages" },
          { icon: <UserIcon />, label: "Profile" },
        ].map(({ icon, label }) => (
          <button
            key={label}
            title={label}
            className="w-10 h-10 flex items-center justify-center rounded-full text-neutral-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            {icon}
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={() => setComposing(true)}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-[#1d9bf0] text-white text-lg font-bold hover:bg-blue-500 transition-colors"
          title="Post"
        >
          +
        </button>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto border-r border-white/10">
        {/* Header with tabs */}
        <div className="sticky top-0 bg-black/90 backdrop-blur border-b border-white/10 z-10">
          <div className="px-4 pt-3 pb-0">
            {cycleData && (
              <div className="text-xs text-blue-400 mb-1 font-normal">{cycleData.header}</div>
            )}
          </div>
          <div className="flex">
            <button
              onClick={() => setActiveTab("for-you")}
              className={`flex-1 py-3 text-sm font-semibold transition-colors relative ${activeTab === "for-you" ? "text-white" : "text-neutral-500 hover:text-neutral-300"}`}
            >
              For You
              {activeTab === "for-you" && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-[#1d9bf0] rounded-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("following")}
              className={`flex-1 py-3 text-sm font-semibold transition-colors relative ${activeTab === "following" ? "text-white" : "text-neutral-500 hover:text-neutral-300"}`}
            >
              Following
              {activeTab === "following" && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-[#1d9bf0] rounded-full" />
              )}
            </button>
          </div>
        </div>

        {/* Compose area */}
        {composing ? (
          <div className="px-4 py-3 border-b border-white/10">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold shrink-0">
                Y
              </div>
              <div className="flex-1">
                <textarea
                  autoFocus
                  placeholder="What is happening?!"
                  value={composeText}
                  onChange={(e) => setComposeText(e.target.value)}
                  className="w-full bg-transparent text-white placeholder-neutral-600 text-sm leading-relaxed resize-none outline-none min-h-[80px]"
                  maxLength={MAX_CHARS + 20}
                />
                <div className="flex items-center justify-between mt-2">
                  <span className={`text-xs tabular-nums ${charsColor}`}>{charsLeft}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setComposing(false); setComposeText(""); }}
                      className="text-neutral-400 text-xs px-3 py-1.5 rounded-full border border-white/20 hover:bg-white/10"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handlePost}
                      disabled={!composeText.trim() || charsLeft < 0}
                      className="bg-[#1d9bf0] text-white text-xs px-4 py-1.5 rounded-full font-bold hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Post
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setComposing(true)}
            className="w-full px-4 py-3 border-b border-white/10 text-left text-neutral-600 text-sm hover:bg-white/[0.02] transition-colors"
          >
            What is happening?!
          </button>
        )}

        {justPosted && (
          <div className="px-4 py-2 text-xs text-blue-400 border-b border-white/5">
            ✓ Your post is live
          </div>
        )}

        {displayTweets.map((t) => {
          const interaction = getInteraction(t.id);
          const likeCount = t.likes + (interaction.liked ? 1 : 0);
          const rtCount = t.retweets + (interaction.retweeted ? 1 : 0);
          const isVerified = t.verified || VERIFIED_HANDLES.has(t.handle);

          return (
            <div key={t.id} className="px-4 py-3 border-b border-white/10 hover:bg-white/[0.03] cursor-pointer">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold shrink-0">
                  {(t.name[0] ?? "?").toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="font-bold text-sm">{t.name}</span>
                    {isVerified && <VerifiedBadge />}
                    <span className="text-neutral-500 text-xs">{t.handle}</span>
                    <span className="text-neutral-500 text-xs">· {t.time}</span>
                  </div>
                  <p className="text-sm mt-1 leading-relaxed text-neutral-200">{t.text}</p>
                  <div className="flex gap-5 mt-2 text-neutral-500 text-xs tabular-nums">
                    {/* Reply */}
                    <button className="flex items-center gap-1 hover:text-blue-400 transition-colors group">
                      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" className="group-hover:text-blue-400">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      {fmt(t.replies)}
                    </button>
                    {/* Retweet */}
                    <button
                      onClick={(e) => toggleRetweet(t.id, e)}
                      className={`flex items-center gap-1 transition-colors group ${interaction.retweeted ? "text-green-400" : "hover:text-green-400"}`}
                    >
                      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M17 1l4 4-4 4" />
                        <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                        <path d="M7 23l-4-4 4-4" />
                        <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                      </svg>
                      {fmt(rtCount)}
                    </button>
                    {/* Like */}
                    <button
                      onClick={(e) => toggleLike(t.id, e)}
                      className={`flex items-center gap-1 transition-colors group ${interaction.liked ? "text-red-500" : "hover:text-red-400"}`}
                    >
                      <svg viewBox="0 0 24 24" width="15" height="15" fill={interaction.liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                      {fmt(likeCount)}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Right panel */}
      <div className="w-52 px-3 py-4 hidden lg:block shrink-0">
        <div className="bg-[#16181c] rounded-xl p-3">
          <div className="font-bold text-sm mb-2">Trending</div>
          {(cycleData?.tags ?? ["#AIGovernance", "#OpenBrain", "#TaiwanTensions", "#AlignmentCrisis"]).map((tag) => (
            <div key={tag} className="py-1.5 border-b border-white/5 text-xs">
              <div className="text-blue-400">{tag}</div>
              <div className="text-neutral-500">Trending · Tech</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
