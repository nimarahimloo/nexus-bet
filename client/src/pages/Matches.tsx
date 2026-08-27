import { Link } from "wouter";
import { ArrowLeft, Search, Zap } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { trpc } from "@/lib/trpc";
import { formatMatchKickoff, formatMatchOdds } from "@shared/sportsDisplay";
import type { MatchCardData } from "@shared/sports";

const fallbackCards = [{ home: "رئال مادرید", homeLogo: "/manus-storage/real-madrid_189097ef.png", away: "بارسلونا", awayLogo: "/manus-storage/barcelona_36dcce68.png", hour: 22, minute: 30, league: "لالیگا", odds: [2.04, 3.62, 3.15] }, { home: "آرسنال", homeLogo: "/manus-storage/arsenal_81af535e.jpg", away: "چلسی", awayLogo: "/manus-storage/chelsea_7ee36ece.png", hour: 20, minute: 0, league: "لیگ برتر", odds: [2.28, 2.94, 4.2] }, { home: "بایرن مونیخ", homeLogo: "/manus-storage/bayern_70a7fa9c.png", away: "دورتموند", awayLogo: "/manus-storage/dortmund_990aaa2a.webp", hour: 20, minute: 0, league: "بوندس‌لیگا", odds: [1.76, 4.18, 4.75] }] as const;
function apiTime(time: string) {
  const [hour, minute] = time.split(":").map(Number);
  return Number.isFinite(hour) && Number.isFinite(minute) ? formatMatchKickoff(hour, minute) : time;
}

function ApiMatchCard({ match }: { match: MatchCardData }) {
  return <article className="standalone-card glass-panel"><span className="sample-chip">{match.status} · {match.league}</span><div className="standalone-teams"><div><span className="sport-logo">{match.homeLogo ? <img src={match.homeLogo} alt="" /> : "⚽"}</span><b>{match.home}</b></div><strong>{match.score ?? apiTime(match.time)}{match.minute ? ` · ${match.minute}` : ""}</strong><div><span className="sport-logo">{match.awayLogo ? <img src={match.awayLogo} alt="" /> : "⚽"}</span><b>{match.away}</b></div></div><div className="market-preview"><span>{match.markets.length ? "بازارهای قابل انتخاب" : "بازارها"}</span>{match.markets.length ? match.markets.slice(0, 3).map((market) => <b key={market.name}>{market.label} {formatMatchOdds(market.odds)}</b>) : <small>در انتظار دریافت odds رسمی</small>}</div></article>;
}

export default function Matches() {
  const sportsQuery = trpc.sports.fixtures.useQuery({ next: 10 }, { staleTime: 30_000, refetchInterval: 60_000 });
  const apiMatches = sportsQuery.data?.matches ?? [];
  return <PageShell eyebrow="مرکز مسابقات" title="مسابقه‌ها، منظم و قابل‌فهم" description="دادهٔ مسابقات از API ورزشی دریافت می‌شود؛ اگر سرویس پاسخ ندهد، کارت‌های نمونه با برچسب روشن نمایش داده می‌شوند." heroImage="/manus-storage/nexus-bet-matches-hero-v2_fbfab850.png"><div className="subpage-toolbar"><label><Search size={16} /><input placeholder="جست‌وجوی تیم یا لیگ" /></label><button>همهٔ ورزش‌ها</button><button>فوتبال</button><span className={`sample-chip ${sportsQuery.data?.source === "api" ? "live-chip" : ""}`}>{sportsQuery.isLoading ? "در حال دریافت" : sportsQuery.data?.source === "api" ? "API واقعی" : "نمونه"}</span></div>{sportsQuery.error && <div className="inline-alert">اتصال به سرویس مسابقات برقرار نشد؛ دادهٔ نمونه برای حفظ تجربه نمایش داده می‌شود.</div>}<div className="standalone-grid">{apiMatches.length ? apiMatches.map((match) => <ApiMatchCard key={match.id} match={match} />) : fallbackCards.map(({ home, homeLogo, away, awayLogo, hour, minute, league, odds }) => <article className="standalone-card glass-panel" key={home}><span className="sample-chip">نمونه · {league}</span><div className="standalone-teams"><div><span className="sport-logo"><img src={homeLogo} alt="" /></span><b>{home}</b></div><strong>{formatMatchKickoff(hour, minute)}</strong><div><span className="sport-logo"><img src={awayLogo} alt="" /></span><b>{away}</b></div></div><div className="market-preview"><span>برد مستقیم</span>{odds.map((odd, index) => <b key={odd}>{["۱", "X", "۲"][index]} {formatMatchOdds(odd)}</b>)}</div></article>)}</div><Link href="/crash" className="outline-cta">بازی انفجار را ببین <Zap size={16} /><ArrowLeft size={16} /></Link></PageShell>;
}
