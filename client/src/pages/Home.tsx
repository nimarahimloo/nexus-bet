import { useAuth } from "@/_core/hooks/useAuth";
import { openAuthModal, openSupportPanel } from "@/lib/platformOverlay";
import { Button } from "@/components/ui/button";
import { calculatePotentialReturn, combinedOdds, getTicketConfirmationState, toggleSelection, validateStakeAgainstWallet, type BettingSelection } from "@/lib/betting";
import { trpc } from "@/lib/trpc";
import type { AiPick } from "@shared/ai";
import type { MatchCardData } from "@shared/sports";
import { formatFaDecimal, formatFaNumber } from "@shared/format";
import { formatSportsFeedStatus } from "@shared/sportsDisplay";
import { FeatureHub } from "./FeaturePages";
import {
  Activity,
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  Bell,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  Copy,
  Crown,
  Diamond,
  Eye,
  FileClock,
  Filter,
  Gift,
  Headphones,
  Landmark,
  LayoutGrid,
  LockKeyhole,
  Menu,
  Minus,
  Plus,
  ReceiptText,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Trophy,
  UserRound,
  WalletCards,
  X,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { BetSheet } from "@/components/BetSheet";
import { toast } from "sonner";
import { Link } from "wouter";

type EventStatus = "نمونه" | "امروز" | "فردا";

type Match = MatchCardData;

type Selection = BettingSelection & {
  id: string;
  match: string;
  market: string;
};

const networkInfo = {
  "TRC-20": { status: "در انتظار اتصال ledger واقعی" },
  "TON": { status: "در انتظار اتصال ledger واقعی" },
  "ERC-20": { status: "در انتظار اتصال ledger واقعی" },
};

const leagues = ["همه", "فوتبال", "تنیس", "بسکتبال", "والیبال"];

function numberFa(value: number, digits = 2) {
  return digits === 0 ? formatFaNumber(value, { maximumFractionDigits: 0 }) : formatFaDecimal(value, digits);
}

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function Home() {
  const { isAuthenticated } = useAuth();
  const walletQuery = trpc.wallet.me.useQuery(undefined, { enabled: isAuthenticated, staleTime: 30_000 });
  const betsQuery = trpc.bet.mine.useQuery(undefined, { enabled: isAuthenticated, staleTime: 30_000 });
  const wallet = walletQuery.data;
  const bets = betsQuery.data ?? [];
  const openBets = bets.filter((bet) => bet.status === "pending");
  const sportsQuery = trpc.sports.fixtures.useQuery({ next: 10 }, { staleTime: 30_000, refetchInterval: 60_000 });
  const liveQuery = trpc.sports.live.useQuery(undefined, { staleTime: 15_000, refetchInterval: 30_000 });
  const matches: MatchCardData[] = sportsQuery.data?.matches ?? [];
  const liveMatch = liveQuery.data?.matches?.[0];
  const featuredMatch = matches[0];
  const featuredMarket = featuredMatch?.markets[0];
  const [activeFilter, setActiveFilter] = useState("همه");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedMarketIds, setExpandedMarketIds] = useState<string[]>([]);
  const [selections, setSelections] = useState<Selection[]>([]);
  const [stake, setStake] = useState("25");
  const [network, setNetwork] = useState<keyof typeof networkInfo>("TRC-20");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [slipOpen, setSlipOpen] = useState(false);
  const [ticketOpen, setTicketOpen] = useState(false);
  const placeBetMutation = trpc.bet.place.useMutation({ onSuccess: (result) => { setTicketOpen(false); setSelections([]); toast.success(`بلیت ${result.ticketCode} ثبت شد.`); void walletQuery.refetch(); }, onError: (error) => { toast.error(error.message.includes("INSUFFICIENT") ? "موجودی برای این بلیت کافی نیست." : "ثبت بلیت انجام نشد؛ دوباره بررسی کن."); } });

  const [lastAddedSelectionId, setLastAddedSelectionId] = useState<string | null>(null);
  const [removingSelectionId, setRemovingSelectionId] = useState<string | null>(null);
  const [responsibleConfirmed, setResponsibleConfirmed] = useState(false);
  const availableBalance = walletQuery.data?.availableBalance ?? 0;
  const lockedBalance = walletQuery.data?.lockedBalance ?? 0;
  const walletLoading = isAuthenticated && walletQuery.isLoading;
  const walletError = isAuthenticated && !!walletQuery.error;
  const numericStake = Number(stake.replace(",", "."));
  const odds = useMemo(() => combinedOdds(selections), [selections]);
  const potentialReturn = calculatePotentialReturn(numericStake, odds);
  const potentialProfit = Math.max(0, Number((potentialReturn - numericStake).toFixed(2)));
  const liveReturnKey = `${stake}-${odds}-${potentialReturn}`;
  const stakeValidation = validateStakeAgainstWallet({ authenticated: isAuthenticated, loading: walletLoading, error: walletError, stake: numericStake, availableBalance });
  const stakeValid = stakeValidation.canPlace;
  const filteredMatches = matches.filter((match) => (activeFilter === "همه" || match.sport === activeFilter) && `${match.league} ${match.home} ${match.away} ${match.insight}`.toLowerCase().includes(searchTerm.trim().toLowerCase()));
  const aiCandidates = useMemo(() => matches.flatMap((match) => match.markets.filter((market) => market.odds > 0).map((market, index) => ({
    eventId: match.id,
    league: match.league,
    match: `${match.home} — ${match.away}`,
    sport: match.sport,
    marketLabel: market.label,
    marketName: market.name,
    odds: market.odds,
    status: match.status,
    popularity: Math.max(58, 94 - index * 8 - (match.status === "فردا" ? 7 : 0)),
  }))), [matches]);
  const aiQuery = trpc.ai.smartPicks.useQuery({ candidates: aiCandidates }, { enabled: false, staleTime: 60_000 });

  const addSelection = (match: Match, market: Match["markets"][number]) => {
    if (market.odds === 0) {
      toast.info("بازارهای تکمیلی این رویداد به‌زودی در دسترس قرار می‌گیرد.");
      return;
    }
    const selectionId = `${match.id}-${market.label}`;
    const selection = { id: selectionId, match: `${match.home} — ${match.away}`, market: market.name, odds: market.odds };
    if (selections.some((item) => item.id === selectionId)) {
      setRemovingSelectionId(selectionId);
      window.setTimeout(() => {
        setSelections((items) => toggleSelection(items, selection).items);
        setRemovingSelectionId((current) => current === selectionId ? null : current);
      }, 280);
      toast.message("انتخاب از بلیت حذف شد.");
      return;
    }
    setSelections((items) => toggleSelection(items, selection).items);
    setLastAddedSelectionId(selectionId);
    window.setTimeout(() => setLastAddedSelectionId((current) => current === selectionId ? null : current), 650);
    setSlipOpen(true);
    toast.success("انتخاب به بلیت شما افزوده شد.");
  };

  const addAiPick = (pick: AiPick) => {
    const match = matches.find((item) => item.id === pick.eventId);
    const market = match?.markets.find((item) => item.label === pick.marketLabel);
    if (match && market) addSelection(match, market);
  };

  const requestWithdrawal = () => {
    const amount = Number(withdrawAmount);
    if (!Number.isFinite(amount) || amount < 10 || !withdrawAddress.trim()) {
      toast.error("برای برداشت، مبلغ حداقل ۱۰ USDT و آدرس مقصد را وارد کنید.");
      return;
    }
    if (amount > availableBalance) {
      toast.error("مبلغ برداشت نمی‌تواند از موجودی قابل‌استفاده بیشتر باشد.");
      return;
    }
    toast.info("ثبت برداشت واقعی پس از اتصال ledger و بررسی امنیتی فعال می‌شود.");
  };

  const showTicket = () => {
    const confirmationState = getTicketConfirmationState({ selectionCount: selections.length, authenticated: isAuthenticated, loading: walletLoading, error: walletError, stake: numericStake, availableBalance });
    if (confirmationState === "guest") {
      toast.error("برای ثبت بلیت، ابتدا وارد حساب کاربری شوید.");
      openAuthModal();
      return;
    }
    if (confirmationState === "loading") {
      toast.info("در حال دریافت موجودی کیف پول شما هستیم.");
      return;
    }
    if (confirmationState === "error") {
      toast.error("موجودی کیف پول دریافت نشد؛ دوباره تلاش کنید.");
      return;
    }
    if (confirmationState === "empty") {
      toast.error("برای ادامه، حداقل یک بازار را انتخاب کنید.");
      return;
    }
    if (confirmationState !== "ready" || !stakeValid) {
      toast.error("مبلغ باید بین ۱ و موجودی قابل‌استفادهٔ شما باشد.");
      return;
    }
    setSlipOpen(false);
    setTicketOpen(true);
  };

  const sheetStatusMessage = !isAuthenticated ? "برای ثبت بلیت ابتدا وارد حساب شوید." : walletLoading ? "در حال دریافت موجودی واقعی کیف پول…" : walletError ? "موجودی کیف پول در دسترس نیست." : stakeValidation.state === "insufficient" ? `موجودی کافی نیست؛ ${numberFa(numericStake - availableBalance)} USDT دیگر نیاز دارید.` : stakeValidation.state === "invalid" ? "مبلغ باید حداقل ۱ USDT باشد." : null;

  const confirmTicket = () => {
    if (!stakeValid || !selections.length || placeBetMutation.isPending) return;
    placeBetMutation.mutate({ stake: numericStake, selections });
  };

  return (
    <PageShell isHome>
      <div className="aurora aurora-one" />
      <div className="aurora aurora-two" />

      <section className="hero container" id="discover">
        <div className="hero-copy">
          <div className="eyebrow"><Sparkles size={15} /> همه‌چیز برای انتخاب سریع</div>
          <h1>مسابقه را ببین؛ انتخابت را ثبت کن.</h1>
          <p>بازی‌های مهم، بازارهای خوانا و کیف پول USDT؛ بدون شلوغی اضافه.</p>
          <div className="hero-cta">
            <Button className="primary-cta" onClick={() => scrollTo("live")}><Zap size={18} /> مشاهدهٔ مسابقات زنده</Button>
            <button className="text-cta" onClick={() => scrollTo("wallet")}>آشنایی با کیف پول <ArrowLeft size={17} /></button>
          </div>
          <div className="hero-trust">
            <span><ShieldCheck size={16} /> مدیریت چندشبکه‌ای USDT</span>
            <span><LockKeyhole size={16} /> کنترل‌های امنیتی</span>
          </div>
        </div>

        <div className="hero-score glass-panel"><img className="hero-art" src="/manus-storage/nexus-bet-hero_64d33d2f.jpg" alt="استادیوم شبانه و شبکهٔ Nexus Bet" />
          <div className="nexus-network" aria-hidden="true"><i /><i /><i /><i /></div>
          {featuredMatch ? <><div className="score-top"><span className={sportsQuery.data?.source === "api" ? "live-chip" : "demo-tag"}>{sportsQuery.data?.source === "api" ? "API واقعی" : "بدون دادهٔ عملیاتی"}</span><span>{featuredMatch.league}</span><span aria-hidden="true"><Crown size={16} /></span></div><div className="scoreboard"><div><span className="team-orb red">{featuredMatch.home.slice(0, 1)}</span><b>{featuredMatch.home}</b></div><div className="score-center"><strong>{featuredMatch.score ?? "— · —"}</strong><span>{featuredMatch.status}</span></div><div><span className="team-orb blue">{featuredMatch.away.slice(0, 1)}</span><b>{featuredMatch.away}</b></div></div>{featuredMarket ? <div className="hero-market"><span>{featuredMarket.name}</span><b>{numberFa(featuredMarket.odds)}</b><button onClick={() => addSelection(featuredMatch, featuredMarket)} aria-label="افزودن بازار به بلیت"><Plus size={17} /></button></div> : <div className="hero-market is-unavailable"><span>بازار رسمی این مسابقه هنوز دریافت نشده است</span><span>—</span></div>}<div className="signal-row"><span><Activity size={14} /> {formatFaNumber(featuredMatch.markets.length, { maximumFractionDigits: 0 })} بازار رسمی</span><span>{sportsQuery.data?.source === "api" ? "فید API" : "در انتظار منبع"}</span></div></> : <div className="hero-empty"><span><Activity size={18} /></span><b>هنوز مسابقهٔ قابل‌نمایشی از منبع واقعی دریافت نشده است.</b><small>{sportsQuery.isLoading ? "در حال دریافت فید مسابقات…" : sportsQuery.data?.error ?? "به‌محض آماده‌شدن فید، این بخش به‌روزرسانی می‌شود."}</small><Link href="/matches" className="outline-cta">رفتن به مرکز مسابقات <ArrowLeft size={15} /></Link></div>}
        </div>
      </section>

      <FeatureHub />

      <section className="content-grid container" id="live">
        <div className="events-column">
          <div className="section-heading">
            <div><div className="section-kicker">روی خط بازی</div><h2>بازی‌های امروز</h2></div>
            <div className="discover-tools"><label className="mobile-search"><Search size={15} /><input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="جست‌وجوی مسابقه یا لیگ" aria-label="جست‌وجوی مسابقه یا لیگ" /></label><button className="filter-control"><Filter size={17} /> فیلتر</button></div>
          </div>
          <div className="filter-row" role="tablist" aria-label="فیلتر ورزش">
            {leagues.map((league) => <button key={league} onClick={() => setActiveFilter(league)} className={`filter-pill ${activeFilter === league ? "selected" : ""}`}>{league}{league === "فوتبال" && <span>۱۸</span>}</button>)}
          </div>
          <div className="feed-status" role="status">{formatSportsFeedStatus({ loading: sportsQuery.isLoading, source: sportsQuery.data?.source, error: sportsQuery.data?.error })}</div>

          <div className="live-center glass-panel"><div className="live-center-top"><span className="status-live"><i /> مرکز زنده</span><b>{liveMatch ? `${liveMatch.home} — ${liveMatch.away}` : "در حال بررسی مسابقات زنده"}</b><small>{liveMatch ? `${liveMatch.minute ?? "اکنون"} · ${liveMatch.score ?? "بدون نتیجه"}` : liveQuery.data?.error ?? "فعلاً مسابقهٔ زنده‌ای گزارش نشده است"}</small></div><div className="live-pulse-line"><span style={{ width: liveMatch ? "67%" : "8%" }} /></div><div className="live-center-bottom"><span>{liveMatch ? "دادهٔ زنده از API" : "مرکز زنده"}</span><button onClick={() => setActiveFilter("فوتبال")}>مشاهدهٔ بازارهای زنده <ArrowLeft size={14} /></button></div></div>

          <div className="feature-strip glass-panel">
            <div className="feature-icon"><Trophy size={20} /></div>
            <div><span>انتخاب سردبیر</span><b>۳ مسابقهٔ پرطرفدار امروز</b></div>
            <button onClick={() => setActiveFilter("همه")}>نمایش <ArrowLeft size={15} /></button>
          </div>

          <section className="ai-picks glass-panel" aria-labelledby="ai-picks-title"><img className="section-art ai-art" src="/manus-storage/nexus-bet-ai_93b4cb7e.jpg" alt="هستهٔ هوش مصنوعی Nexus AI" />
            <div className="ai-heading">
              <div className="ai-title-wrap"><span className="ai-orb"><Sparkles size={18} /></span><div><span className="section-kicker">تحلیل Nexus AI</span><h3 id="ai-picks-title">انتخاب‌های دقیق امروز</h3></div></div>
              <button className="ai-refresh" onClick={() => aiQuery.refetch()} disabled={aiQuery.isFetching}>{aiQuery.isFetching ? "در حال تحلیل…" : "تحلیل مسابقات"}<ArrowLeft size={15} /></button>
            </div>
            <p className="ai-subtitle">Nexus AI چند نشانه را کنار هم می‌گذارد؛ انتخاب نهایی با خودت است.</p>
            {!aiQuery.data && !aiQuery.isFetching && <div className="ai-empty"><span><Sparkles size={16} /></span><b>برای دیدن پیشنهادهای توضیح‌پذیر، تحلیل را شروع کنید.</b></div>}
            {aiQuery.isFetching && <div className="ai-empty"><span className="ai-pulse"><Activity size={16} /></span><b>در حال بررسی وضعیت مسابقات و بازارها…</b></div>}
            {aiQuery.data && !aiQuery.isFetching && <div className="ai-list">{aiQuery.data.picks.map((pick: AiPick) => <article className="ai-pick" key={`${pick.eventId}-${pick.marketLabel}`}><div className="ai-pick-top"><div><span className="ai-tags">{pick.tags.map((tag: string) => <em key={tag}>{tag}</em>)}</span><b>{pick.marketName}</b><small>{pick.match} · {pick.league}</small></div><strong>{numberFa(pick.odds)}</strong></div><div className="ai-pick-meta"><span className={`risk risk-${pick.risk === "کم" ? "low" : pick.risk === "متوسط" ? "mid" : "high"}`}>ریسک {pick.risk}</span><span>اعتماد {numberFa(pick.confidence, 0)}٪</span><button onClick={() => addAiPick(pick)}>{selections.some((selection) => selection.id === `${pick.eventId}-${pick.marketLabel}`) ? "در بلیت" : "افزودن"}{selections.some((selection) => selection.id === `${pick.eventId}-${pick.marketLabel}`) ? <Check size={14} /> : <Plus size={14} />}</button></div><p>{pick.rationale}</p></article>)}</div>}
            <div className="ai-disclaimer"><ShieldCheck size={13} /> پیشنهاد الگوریتمی است و تضمین سود یا نتیجه محسوب نمی‌شود.</div>
          </section>

          <div className="match-list">
            {filteredMatches.map((match) => (
              <article className={`match-card glass-panel ${match.status === "نمونه" ? "is-demo" : ""}`} key={match.id}>{match.status === "نمونه" && <img className="match-art" src="/manus-storage/nexus-bet-live-match_f1d157ef.jpg" alt="تصویر تزئینی مسابقات فوتبال" />}
                <div className="match-meta">
                  <span className={match.status === "نمونه" ? "status-demo" : "status-upcoming"}>{match.status}</span>
                  <span>{match.league}</span><span className="dot-divider">•</span><span>{match.insight}</span>
                </div>
                <div className="match-body">
                  <div className="teams">
                    <div><span className={`team-badge ${match.homeLogo ? "team-logo" : "sport-logo"}`}>{match.homeLogo ? <img src={match.homeLogo} alt="" loading="lazy" /> : <Trophy size={15} />}</span><b>{match.home}</b></div>
                    <div className="match-time">{match.score ? <strong>{match.score}</strong> : <strong>{match.time}</strong>}<small>{match.minute ?? "شروع مسابقه"}</small></div>
                    <div><b>{match.away}</b><span className={`team-badge ${match.awayLogo ? "team-logo muted" : "sport-logo muted"}`}>{match.awayLogo ? <img src={match.awayLogo} alt="" loading="lazy" /> : <Trophy size={15} />}</span></div>
                  </div>
                  <div className="market-row">
                    {(expandedMarketIds.includes(match.id) ? match.markets : match.markets.slice(0, 3)).map((market) => {
                      const isSelected = selections.some((selection) => selection.id === `${match.id}-${market.label}`);
                      return <button onClick={() => addSelection(match, market)} key={market.label} className={`odds-button ${isSelected ? "chosen" : ""} ${market.odds === 0 ? "more" : ""}`}>
                        <span>{market.label}</span><b>{market.odds ? numberFa(market.odds) : <Plus size={17} />}</b>
                      </button>;
                    })}
                  </div>
                  {match.markets.length > 3 && <button className="markets-toggle" onClick={() => setExpandedMarketIds((ids) => ids.includes(match.id) ? ids.filter((id) => id !== match.id) : [...ids, match.id])}>{expandedMarketIds.includes(match.id) ? "بستن بازارها" : `+${match.markets.length - 3} بازار دیگر`}<ChevronDown size={14} className={expandedMarketIds.includes(match.id) ? "rotated" : ""} /></button>}
                </div>
              </article>
            ))}
          </div>
          {(searchTerm || activeFilter !== "همه") && <button className="show-more" onClick={() => { setSearchTerm(""); setActiveFilter("همه"); }}>پاک‌کردن جست‌وجو و نمایش همه <ChevronDown size={17} /></button>}
        </div>

          <aside className="slip-card glass-panel" aria-label="بلیت پیش‌بینی">
          <div className="slip-head"><div><ReceiptText size={20} /><h3>بلیت من</h3><span>{selections.length} انتخاب</span></div><div className="slip-head-actions"><button onClick={() => setSelections([])} disabled={!selections.length}>پاک‌سازی</button><button className="slip-mobile-close" onClick={() => setSlipOpen(false)} aria-label="بستن بلیت"><X size={16} /></button></div></div>
          {selections.length === 0 ? (
            <div className="slip-empty"><div><LayoutGrid size={25} /></div><b>هنوز انتخابی ندارید</b><p>یک ضریب از مسابقات را لمس کنید تا بلیت شما آماده شود.</p></div>
          ) : (
            <>
              <div className="selection-list">
                {selections.map((selection) => <div className={`selection ${lastAddedSelectionId === selection.id ? "selection-enter" : ""} ${removingSelectionId === selection.id ? "selection-exit" : ""}`} key={selection.id}><button onClick={() => { setRemovingSelectionId(selection.id); window.setTimeout(() => { setSelections((items) => items.filter((item) => item.id !== selection.id)); setRemovingSelectionId(null); }, 280); toast.message("انتخاب از بلیت حذف شد."); }} aria-label="حذف انتخاب"><X size={15} /></button><div><b>{selection.market}</b><span>{selection.match}</span></div><strong>{numberFa(selection.odds)}</strong></div>)}
              </div>
              <div className="slip-stats"><span>ضریب ترکیبی</span><b>{numberFa(odds)}</b><small className={walletLoading ? "balance-status loading" : "balance-status"}>{walletLoading ? "در حال همگام‌سازی" : `موجودی: ${numberFa(availableBalance)} USDT`}</small></div>
              <label className="stake-input"><span>مبلغ پیش‌بینی</span><div><input inputMode="decimal" value={stake} onChange={(event) => setStake(event.target.value)} aria-label="مبلغ به USDT"/><em>USDT</em></div></label>
              {walletLoading && <p className="balance-live loading">در حال دریافت موجودی واقعی کیف پول…</p>}
              {walletError && <p className="input-error">موجودی کیف پول در دسترس نیست؛ لطفاً دوباره تلاش کنید.</p>}
              {!isAuthenticated && <p className="balance-live login-required">برای استفاده از موجودی واقعی، وارد حساب کاربری شوید.</p>}
              {isAuthenticated && !walletLoading && !walletError && stake && numericStake > availableBalance && <p className="input-error live-insufficient">موجودی کافی نیست؛ {numberFa(numericStake - availableBalance)} USDT دیگر نیاز دارید.</p>}
              {isAuthenticated && !walletLoading && !walletError && stake && numericStake > 0 && numericStake <= availableBalance && numericStake < 1 && <p className="input-error">حداقل مبلغ شرط ۱ USDT است.</p>}
              <div className="return-box" key={liveReturnKey}><div className="return-label"><span>بازگشت کل احتمالی</span><em>USDT</em></div><b>{numberFa(potentialReturn)} <small>USDT</small></b><div className="profit-live"><span>سود احتمالی زنده</span><strong>+{numberFa(potentialProfit)} <small>USDT</small></strong></div></div>
              <Button className="ticket-button" onClick={showTicket}>ادامه و بررسی بلیت <ArrowLeft size={17} /></Button>
            </>
          )}
          <p className="slip-note"><ShieldCheck size={14} /> قبل از ثبت نهایی، مبلغ و ضریب را دوباره بررسی کنید.</p>
        </aside>
      </section>

      <section className="wallet-section container" id="wallet">
        <div className="section-heading"><div><span className="section-kicker">دارایی‌های شما</span><h2>موجودی‌ات، یک نگاه</h2></div><button className="text-link" onClick={() => scrollTo("account")}>همهٔ تراکنش‌ها <ArrowLeft size={16} /></button></div>
        <div className="wallet-layout">
          <div className="balance-overview glass-panel"><img className="section-art wallet-art" src="/manus-storage/nexus-bet-wallet_041598ee.jpg" alt="کیف پول شیشه‌ای USDT" />
            <div className="wallet-card-top"><span className="wallet-logo"><WalletCards size={22} /></span><div><span>کیف پول اصلی</span><b>USDT <small>· Tether</small></b></div><button><Eye size={18} /></button></div>
            <div className="total-balance"><span>موجودی کل</span><strong>{numberFa(availableBalance + lockedBalance)} <small>USDT</small></strong><em>≈ {numberFa((availableBalance + lockedBalance) * 1.0, 0)} دلار آمریکا</em></div>
            <div className="balance-breakdown"><div><span>قابل‌استفاده</span><b>{numberFa(availableBalance)} USDT</b><i className="positive" /></div><div><span>قفل‌شده در شرط‌های باز</span><b>{numberFa(lockedBalance)} USDT</b><i className="locked" /></div></div>
            <div className="wallet-actions"><button onClick={() => scrollTo("deposit")}><ArrowDownLeft size={18} /> واریز</button><button onClick={() => scrollTo("withdraw")}><ArrowUpRight size={18} /> برداشت</button><button onClick={() => toast.info("تبدیل ارز به‌زودی افزوده می‌شود.")}><Diamond size={18} /> تبدیل</button></div>
          </div>

          <div className="deposit-panel glass-panel" id="deposit">
            <div className="panel-title"><div><span className="section-kicker">واریز USDT</span><h3>یک شبکه را انتخاب کنید</h3></div><span className="secure-chip"><ShieldCheck size={14} /> امن</span></div>
            <div className="network-tabs">{(Object.keys(networkInfo) as (keyof typeof networkInfo)[]).map((item) => <button key={item} className={network === item ? "active" : ""} onClick={() => setNetwork(item)}>{item}</button>)}</div>
            <div className="address-box is-unavailable"><div><span>آدرس واریز</span><b>{networkInfo[network].status}</b></div><LockKeyhole size={18} /></div>
            <div className="network-detail"><span><Clock3 size={15} /> وضعیت شبکه: در انتظار فعال‌سازی</span><span>کارمزد: پس از اتصال مشخص می‌شود</span></div>
            <p className="wallet-warning"><CircleHelp size={15} /> فقط USDT روی شبکهٔ انتخاب‌شده را به این آدرس ارسال کنید.</p>
          </div>

          <div className="withdraw-panel glass-panel" id="withdraw">
            <div className="panel-title"><div><span className="section-kicker">برداشت</span><h3>ارسال امن USDT</h3></div><LockKeyhole size={19} /></div>
            <div className="withdraw-fields"><label><span>شبکهٔ مقصد</span><select value={network} onChange={(event) => setNetwork(event.target.value as keyof typeof networkInfo)}>{Object.keys(networkInfo).map((item) => <option key={item}>{item}</option>)}</select></label><label><span>مبلغ</span><div className="compact-input"><input value={withdrawAmount} onChange={(event) => setWithdrawAmount(event.target.value)} inputMode="decimal" placeholder="حداقل ۱۰"/><em>USDT</em></div></label><label><span>آدرس مقصد</span><input value={withdrawAddress} onChange={(event) => setWithdrawAddress(event.target.value)} dir="ltr" placeholder="آدرس کیف پول مقصد"/></label></div>
            <Button className="withdraw-button" onClick={requestWithdrawal}>ثبت درخواست برداشت <ArrowLeft size={16} /></Button>
          </div>
        </div>
      </section>

      {selections.length > 0 && <button className="mobile-slip-dock" onClick={() => setSlipOpen(true)}><span><ReceiptText size={17} /> {selections.length} انتخاب</span><b>{numberFa(potentialReturn)} USDT</b><ArrowLeft size={16} /></button>}

      <BetSheet selections={selections} stake={stake} setStake={setStake} odds={odds} open={slipOpen} onClose={() => setSlipOpen(false)} onSubmit={showTicket} canSubmit={Boolean(stakeValid && selections.length && !placeBetMutation.isPending)} statusMessage={sheetStatusMessage} isSubmitting={placeBetMutation.isPending} />

      <section className="vip-section container" id="vip">
        <div className="section-heading"><div><span className="section-kicker"><Crown size={14} /> باشگاه مشتریان Nexus</span><h2>سطح VIP بر اساس فعالیت واقعی</h2></div><Link href="/vip" className="text-link">مشاهده وضعیت <ArrowLeft size={16} /></Link></div>
        <div className="vip-panel glass-panel"><div className="vip-hero-copy"><div className="vip-emblem"><Crown size={25} /></div><div><span className="vip-overline">وضعیت داده</span><h3>در انتظار اتصال event ledger</h3><p>تا زمانی که فعالیت معتبر ثبت نشود، امتیاز و progress ساختگی نمایش داده نمی‌شود.</p></div></div><div className="vip-progress-wrap"><div className="vip-progress-head"><span>پیشرفت سطح</span><strong>—</strong></div><div className="vip-progress-track"><span style={{ width: "0%" }} /></div><div className="vip-progress-foot"><span>پس از اتصال محاسبه می‌شود</span><b>—</b><span>سطح بعدی</span></div></div><p className="vip-note"><ShieldCheck size={14} /> مزایا بعد از اتصال backend باشگاه و ثبت رویدادهای واقعی فعال می‌شوند.</p></div>
      </section>


      <section className="account-section container" id="account">
        <div className="section-heading"><div><span className="section-kicker">فضای شخصی شما</span><h2>حساب تو، همین‌جا</h2></div><button className="text-link" onClick={openSupportPanel}><Headphones size={16} /> پشتیبانی</button></div>
        <div className="account-grid">
          <article className="account-card glass-panel open-bets"><div className="card-header"><span className="icon-surface violet"><FileClock size={19} /></span><div><span>شرط‌های باز</span><b>{isAuthenticated ? `${formatFaNumber(openBets.length, { maximumFractionDigits: 0 })} بلیت فعال` : "ورود لازم است"}</b></div><Link href="/account" aria-label="مشاهدهٔ شرط‌های باز"><ArrowLeft size={16} /></Link></div>{openBets[0] ? <><div className="open-bet-line"><div><span>{openBets[0].selections[0]?.match ?? "انتخاب ثبت‌شده"}</span><b>{openBets[0].selections[0]?.market ?? "بازار ثبت‌شده"}</b></div><strong>{numberFa(openBets[0].combinedOdds)}</strong></div><div className="open-bet-footer"><span>مبلغ: {numberFa(openBets[0].stake)} USDT</span><span>بازگشت: {numberFa(openBets[0].potentialReturn)} USDT</span></div></> : <p className="data-state">{betsQuery.isLoading ? "در حال دریافت…" : isAuthenticated ? "هنوز بلیت باز ندارید." : "برای مشاهدهٔ بلیت‌های واقعی وارد شوید."}</p>}</article>
          <article className="account-card glass-panel"><div className="card-header"><span className="icon-surface mint"><Landmark size={19} /></span><div><span>وضعیت کیف پول</span><b>{isAuthenticated ? "backend واقعی" : "ورود لازم است"}</b></div><Link href="/wallet" aria-label="مشاهدهٔ کیف پول"><ArrowLeft size={16} /></Link></div><div className="activity-line"><div className="activity-icon incoming"><ArrowDownLeft size={15} /></div><div><b>قابل‌استفاده</b><span>موجودی منبع wallet.me</span></div><strong className="income">{isAuthenticated && wallet ? `${numberFa(availableBalance)} USDT` : "—"}</strong></div><div className="activity-line"><div className="activity-icon outgoing"><ArrowUpRight size={15} /></div><div><b>قفل‌شده</b><span>در بلیت‌های باز</span></div><strong>{isAuthenticated && wallet ? `${numberFa(lockedBalance)} USDT` : "—"}</strong></div></article>
          <article className="account-card glass-panel history-card"><div className="card-header"><span className="icon-surface violet"><FileClock size={19} /></span><div><span>تاریخچهٔ بلیت‌ها</span><b>{isAuthenticated ? "از backend" : "بدون داده"}</b></div><Link href="/account" aria-label="مشاهدهٔ تاریخچه"><ArrowLeft size={16} /></Link></div>{betsQuery.isLoading ? <p className="data-state">در حال دریافت تاریخچه…</p> : bets.slice(0, 2).map((bet) => <div className="history-line" key={bet.id}><span>{bet.selections[0]?.match ?? "بلیت"}</span><strong>{bet.status === "pending" ? "باز" : bet.status}</strong></div>)}{isAuthenticated && !betsQuery.isLoading && !bets.length && <p className="data-state">هنوز فعالیت ثبت‌شده‌ای وجود ندارد.</p>}</article><article className="account-card glass-panel safety-card"><div className="card-header"><span className="icon-surface gold"><ShieldCheck size={19} /></span><div><span>امنیت و مسئولیت‌پذیری</span><b>حفاظت فعال</b></div></div><div className="safety-items"><button onClick={() => toast.info("مدیریت محدودیت‌ها در پنل کاربری قابل تنظیم است.")}><span><Settings2 size={16} /> تنظیم محدودیت‌ها</span><ArrowLeft size={15} /></button><button onClick={() => toast.info("تنظیمات امنیتی و ورود دومرحله‌ای به‌زودی کامل می‌شود.")}><span><LockKeyhole size={16} /> تنظیمات امنیتی</span><ArrowLeft size={15} /></button></div></article>
        </div>
      </section>

      <section className="responsible container" id="responsible"><div className="demo-disclosure"><span><ShieldCheck size={15} /> {sportsQuery.data?.source === "api" ? "دادهٔ مسابقات از API واقعی" : "دادهٔ عملیاتی مسابقات در دسترس نیست"}</span><small>{sportsQuery.data?.source === "api" ? "زمان، نتیجه و وضعیت از آخرین پاسخ سرویس ورزشی خوانده می‌شود؛ odds فقط در صورت ارائهٔ provider رسمی نمایش داده می‌شود." : sportsQuery.data?.error ?? "در این وضعیت هیچ odds یا نتیجه‌ای به‌عنوان دادهٔ واقعی نمایش داده نمی‌شود."}</small></div>
        <div className="responsible-content"><div className="responsible-icon"><ShieldCheck size={22} /></div><div><b>قبل از بازی، حد خودت را مشخص کن.</b><p>این سرویس برای افراد بالای ۱۸ سال است. شرط‌بندی ریسک مالی دارد و سود تضمین‌شده‌ای وجود ندارد.</p></div></div><div className="responsible-actions"><button className={responsibleConfirmed ? "is-confirmed" : ""} onClick={() => { setResponsibleConfirmed(true); toast.success("تأیید سن ثبت شد؛ با آگاهی ادامه بده."); }}>{responsibleConfirmed ? <><Check size={15} /> تأیید شد</> : "بالای ۱۸ سال هستم"}</button><button onClick={() => toast.info("محدودیت مبلغ و زمان را از همین بخش مدیریت کن.")}>تعیین محدودیت <ArrowLeft size={16} /></button></div><div className="responsible-links"><button onClick={() => scrollTo("terms")}>شرایط استفاده</button><span>·</span><button onClick={() => scrollTo("responsible")}>بازی مسئولانه</button></div>
      </section>
      <section className="terms-strip container" id="terms"><span><FileClock size={15} /> قوانین کوتاه و روشن</span><p>احراز سن، کنترل مبلغ و توقف دسترسی باید همیشه در اختیار کاربر باشد. در صورت از دست‌دادن کنترل، ادامه نده و از پشتیبانی کمک بگیر.</p></section>

      <footer className="site-footer container"><div className="footer-brand"><span className="brand-mark">N</span><b>NEXUS BET</b><p>تجربهٔ نوین پیش‌بینی ورزشی با USDT</p></div><div className="footer-links"><a href="#discover">مسابقات</a><a href="#wallet">کیف پول</a><button onClick={() => scrollTo("responsible")}>قوانین و ریسک</button><button onClick={() => scrollTo("terms")}>شرایط استفاده</button></div><span className="age-mark">+۱۸</span></footer>

      {ticketOpen && <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="خلاصه بلیت"><div className="ticket-modal glass-panel"><button className="modal-close" onClick={() => setTicketOpen(false)} aria-label="بستن"><X size={18} /></button><div className="ticket-success"><Check size={20} /></div><span className="section-kicker">بازبینی نهایی</span><h2>بلیت شما آمادهٔ ثبت است</h2><div className="ticket-summary">{selections.map((selection) => <div key={selection.id}><span>{selection.market}<small>{selection.match}</small></span><b>{numberFa(selection.odds)}</b></div>)}</div><div className="ticket-total"><span>مبلغ</span><b>{numberFa(numericStake)} USDT</b><span>بازده احتمالی</span><strong>{numberFa(potentialReturn)} USDT</strong></div><Button className="age-confirm" onClick={confirmTicket} disabled={placeBetMutation.isPending}>{placeBetMutation.isPending ? "در حال ثبت…" : "تأیید و ثبت بلیت"} {!placeBetMutation.isPending && <ArrowLeft size={17} />}</Button><p>پس از ثبت، بلیت در بخش شرط‌های باز قابل پیگیری است.</p></div></div>}
    </PageShell>
  );
}
