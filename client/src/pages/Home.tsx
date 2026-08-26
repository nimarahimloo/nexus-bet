import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Button } from "@/components/ui/button";
import { calculatePotentialReturn, combinedOdds, isValidUsdtStake, toggleSelection, type BettingSelection } from "@/lib/betting";
import { trpc } from "@/lib/trpc";
import type { AiPick } from "@shared/ai";
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
import { toast } from "sonner";

type EventStatus = "زنده" | "امروز" | "فردا";

type Match = {
  id: string;
  league: string;
  sport: string;
  status: EventStatus;
  time: string;
  minute?: string;
  home: string;
  away: string;
  score?: string;
  markets: { label: string; name: string; odds: number }[];
  insight: string;
};

type Selection = BettingSelection & {
  id: string;
  match: string;
  market: string;
};

const matches: Match[] = [
  {
    id: "rma-bar",
    league: "لالیگا · اسپانیا",
    sport: "فوتبال",
    status: "امروز",
    time: "۲۲:۳۰",
    home: "رئال مادرید",
    away: "بارسلونا",
    markets: [
      { label: "۱", name: "برد رئال مادرید", odds: 2.04 },
      { label: "X", name: "مساوی", odds: 3.62 },
      { label: "۲", name: "برد بارسلونا", odds: 3.15 },
    ],
    insight: "داغ‌ترین مسابقهٔ امروز",
  },
  {
    id: "ars-che",
    league: "لیگ برتر · انگلیس",
    sport: "فوتبال",
    status: "زنده",
    time: "نیمهٔ دوم",
    minute: "۶۷′",
    home: "آرسنال",
    away: "چلسی",
    score: "۱ — ۱",
    markets: [
      { label: "۱", name: "برد آرسنال", odds: 2.28 },
      { label: "X", name: "مساوی", odds: 2.94 },
      { label: "۲", name: "برد چلسی", odds: 4.2 },
    ],
    insight: "ضریب‌ها در حال به‌روزرسانی",
  },
  {
    id: "bayern-dortmund",
    league: "بوندس‌لیگا · آلمان",
    sport: "فوتبال",
    status: "فردا",
    time: "۲۰:۰۰",
    home: "بایرن مونیخ",
    away: "دورتموند",
    markets: [
      { label: "۱", name: "برد بایرن مونیخ", odds: 1.76 },
      { label: "X", name: "مساوی", odds: 4.18 },
      { label: "۲", name: "برد دورتموند", odds: 4.75 },
    ],
    insight: "بیش از ۳۴۰ انتخاب فعال",
  },
  {
    id: "sinner-alcaraz",
    league: "مسترز · تنیس",
    sport: "تنیس",
    status: "امروز",
    time: "۱۹:۴۵",
    home: "ی. سینر",
    away: "ک. آلکاراس",
    markets: [
      { label: "۱", name: "برد ی. سینر", odds: 1.92 },
      { label: "۲", name: "برد ک. آلکاراس", odds: 1.98 },
      { label: "+", name: "بازارهای بیشتر", odds: 0 },
    ],
    insight: "فینال · زمین سخت",
  },
];

const networkInfo = {
  "TRC-20": { address: "TUf9...8bM2", confirmations: "۱ تأیید", fee: "۱ USDT" },
  "TON": { address: "UQD4...nF9", confirmations: "۲ تأیید", fee: "۰٫۵ USDT" },
  "ERC-20": { address: "0x72A4...D09E", confirmations: "۱۲ تأیید", fee: "۶ USDT" },
};

const leagues = ["همه", "فوتبال", "تنیس", "بسکتبال", "والیبال"];

function numberFa(value: number, digits = 2) {
  return new Intl.NumberFormat("fa-IR", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
}

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [activeFilter, setActiveFilter] = useState("همه");
  const [selections, setSelections] = useState<Selection[]>([]);
  const [stake, setStake] = useState("25");
  const [network, setNetwork] = useState<keyof typeof networkInfo>("TRC-20");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [slipOpen, setSlipOpen] = useState(false);
  const [ticketOpen, setTicketOpen] = useState(false);
  const [ageAccepted, setAgeAccepted] = useState(false);
  const [ageOpen, setAgeOpen] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const availableBalance = 1284.75;
  const lockedBalance = 164.2;
  const numericStake = Number(stake.replace(",", "."));
  const odds = useMemo(() => combinedOdds(selections), [selections]);
  const potentialReturn = calculatePotentialReturn(numericStake, odds);
  const stakeValid = isValidUsdtStake(numericStake, availableBalance);
  const filteredMatches = activeFilter === "همه" ? matches : matches.filter((match) => match.sport === activeFilter);
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
  }))), []);
  const aiQuery = trpc.ai.smartPicks.useQuery({ candidates: aiCandidates }, { enabled: false, staleTime: 60_000 });

  const addSelection = (match: Match, market: Match["markets"][number]) => {
    if (market.odds === 0) {
      toast.info("بازارهای تکمیلی این رویداد به‌زودی در دسترس قرار می‌گیرد.");
      return;
    }
    if (!ageAccepted) {
      setAgeOpen(true);
      toast.warning("ابتدا تأیید سن و اطلاع از ریسک لازم است.");
      return;
    }
    const selectionId = `${match.id}-${market.label}`;
    const selection = { id: selectionId, match: `${match.home} — ${match.away}`, market: market.name, odds: market.odds };
    if (selections.some((item) => item.id === selectionId)) {
      setSelections((items) => toggleSelection(items, selection).items);
      toast.message("انتخاب از بلیت حذف شد.");
      return;
    }
    setSelections((items) => toggleSelection(items, selection).items);
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
    toast.success("درخواست برداشت برای بررسی امنیتی ثبت شد.");
    setWithdrawAmount("");
    setWithdrawAddress("");
  };

  const showTicket = () => {
    if (!selections.length) {
      toast.error("برای ادامه، حداقل یک بازار را انتخاب کنید.");
      return;
    }
    if (!stakeValid) {
      toast.error("مبلغ باید بین ۱ و موجودی قابل‌استفادهٔ شما باشد.");
      return;
    }
    setTicketOpen(true);
  };

  const confirmTicket = () => {
    setTicketOpen(false);
    setSelections([]);
    toast.success("بلیت شما ثبت شد و در بخش شرط‌های باز قابل پیگیری است.");
  };

  return (
    <main className="nexus-shell">
      <div className="aurora aurora-one" />
      <div className="aurora aurora-two" />
      <header className="topbar glass-panel">
        <button className="brand" onClick={() => scrollTo("discover")} aria-label="Nexus Bet، صفحه نخست">
          <span className="brand-mark">N</span>
          <span>
            <b>NEXUS</b>
            <small>BET</small>
          </span>
        </button>

        <nav className={`main-nav ${menuOpen ? "is-open" : ""}`} aria-label="ناوبری اصلی">
          <button className="nav-link is-active" onClick={() => scrollTo("discover")}>مسابقات</button>
          <button className="nav-link" onClick={() => scrollTo("live")}>زنده <i className="live-dot" /></button>
          <button className="nav-link" onClick={() => scrollTo("wallet")}>کیف پول</button>
          <button className="nav-link" onClick={() => scrollTo("account")}>حساب من</button>
        </nav>

        <div className="header-actions">
          <button className="icon-button notification" aria-label="اعلان‌ها"><Bell size={18} /><span /></button>
          <button className="balance-chip" onClick={() => scrollTo("wallet")}>
            <span className="coin">₮</span>
            <span><b>{numberFa(availableBalance)} USDT</b><small>کیف پول شما</small></span>
            <ChevronDown size={16} />
          </button>
          <Button className="login-button" onClick={() => (isAuthenticated ? scrollTo("account") : startLogin())}>
            <UserRound size={17} />
            {isAuthenticated ? (user?.name ?? "حساب کاربری") : "ورود امن"}
          </Button>
          <button className="icon-button mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="منو">
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      <section className="hero container" id="discover">
        <div className="hero-copy">
          <div className="eyebrow"><Sparkles size={15} /> طراحی‌شده برای تصمیم‌های روشن</div>
          <h1>هر مسابقه، یک <em>تصمیم بهتر.</em></h1>
          <p>رویدادهای محبوب، ضرایب شفاف و کیف پول USDT شما؛ همه در یک تجربهٔ فارسی و امن.</p>
          <div className="hero-cta">
            <Button className="primary-cta" onClick={() => scrollTo("live")}><Zap size={18} /> مشاهدهٔ مسابقات زنده</Button>
            <button className="text-cta" onClick={() => scrollTo("wallet")}>آشنایی با کیف پول <ArrowLeft size={17} /></button>
          </div>
          <div className="hero-trust">
            <span><ShieldCheck size={16} /> مدیریت چندشبکه‌ای USDT</span>
            <span><LockKeyhole size={16} /> کنترل‌های امنیتی</span>
          </div>
        </div>

        <div className="hero-score glass-panel">
          <div className="nexus-network" aria-hidden="true"><i /><i /><i /><i /></div>
          <div className="score-top"><span className="live-tag"><i /> زنده</span><span>لیگ برتر انگلستان</span><button aria-label="افزودن به علاقه‌مندی‌ها"><Crown size={16} /></button></div>
          <div className="scoreboard">
            <div><span className="team-orb red">A</span><b>آرسنال</b></div>
            <div className="score-center"><strong>۱ <small>—</small> ۱</strong><span>دقیقهٔ ۶۷</span></div>
            <div><span className="team-orb blue">C</span><b>چلسی</b></div>
          </div>
          <div className="hero-market">
            <span>بیش از ۱٫۵ گل</span><b>۱٫۷۲</b><button onClick={() => addSelection(matches[1], { label: "o15", name: "بیش از ۱٫۵ گل", odds: 1.72 })}><Plus size={17} /></button>
          </div>
          <div className="signal-row"><span><Activity size={14} /> ۲۷ بازار فعال</span><span>به‌روزرسانی لحظه‌ای</span></div>
        </div>
      </section>

      <section className="content-grid container" id="live">
        <div className="events-column">
          <div className="section-heading">
            <div><span className="section-kicker">اکنون در Nexus</span><h2>مسابقه‌ای برای دنبال‌کردن</h2></div>
            <button className="filter-control"><Filter size={17} /> فیلترهای پیشرفته</button>
          </div>
          <div className="filter-row" role="tablist" aria-label="فیلتر ورزش">
            {leagues.map((league) => <button key={league} onClick={() => setActiveFilter(league)} className={`filter-pill ${activeFilter === league ? "selected" : ""}`}>{league}{league === "فوتبال" && <span>۱۸</span>}</button>)}
          </div>

          <div className="feature-strip glass-panel">
            <div className="feature-icon"><Trophy size={20} /></div>
            <div><span>انتخاب سردبیر</span><b>۳ مسابقهٔ پرطرفدار امروز</b></div>
            <button onClick={() => setActiveFilter("همه")}>نمایش <ArrowLeft size={15} /></button>
          </div>

          <section className="ai-picks glass-panel" aria-labelledby="ai-picks-title">
            <div className="ai-heading">
              <div className="ai-title-wrap"><span className="ai-orb"><Sparkles size={18} /></span><div><span className="section-kicker">تحلیل Nexus AI</span><h3 id="ai-picks-title">پیشنهادهای هوشمند امروز</h3></div></div>
              <button className="ai-refresh" onClick={() => aiQuery.refetch()} disabled={aiQuery.isFetching}>{aiQuery.isFetching ? "در حال تحلیل…" : "تحلیل مسابقات"}<ArrowLeft size={15} /></button>
            </div>
            <p className="ai-subtitle">مدل، ضریب‌ها و محبوبیت بازار را مقایسه می‌کند؛ تصمیم نهایی همیشه با شماست.</p>
            {!aiQuery.data && !aiQuery.isFetching && <div className="ai-empty"><span><Sparkles size={16} /></span><b>برای دیدن پیشنهادهای توضیح‌پذیر، تحلیل را شروع کنید.</b></div>}
            {aiQuery.isFetching && <div className="ai-empty"><span className="ai-pulse"><Activity size={16} /></span><b>در حال بررسی وضعیت مسابقات و بازارها…</b></div>}
            {aiQuery.data && !aiQuery.isFetching && <div className="ai-list">{aiQuery.data.picks.map((pick: AiPick) => <article className="ai-pick" key={`${pick.eventId}-${pick.marketLabel}`}><div className="ai-pick-top"><div><span className="ai-tags">{pick.tags.map((tag: string) => <em key={tag}>{tag}</em>)}</span><b>{pick.marketName}</b><small>{pick.match} · {pick.league}</small></div><strong>{numberFa(pick.odds)}</strong></div><div className="ai-pick-meta"><span className={`risk risk-${pick.risk === "کم" ? "low" : pick.risk === "متوسط" ? "mid" : "high"}`}>ریسک {pick.risk}</span><span>اعتماد {numberFa(pick.confidence, 0)}٪</span><button onClick={() => addAiPick(pick)}>{selections.some((selection) => selection.id === `${pick.eventId}-${pick.marketLabel}`) ? "در بلیت" : "افزودن"}{selections.some((selection) => selection.id === `${pick.eventId}-${pick.marketLabel}`) ? <Check size={14} /> : <Plus size={14} />}</button></div><p>{pick.rationale}</p></article>)}</div>}
            <div className="ai-disclaimer"><ShieldCheck size={13} /> پیشنهاد الگوریتمی است و تضمین سود یا نتیجه محسوب نمی‌شود.</div>
          </section>

          <div className="match-list">
            {filteredMatches.map((match) => (
              <article className={`match-card glass-panel ${match.status === "زنده" ? "is-live" : ""}`} key={match.id}>
                <div className="match-meta">
                  <span className={match.status === "زنده" ? "status-live" : "status-upcoming"}>{match.status === "زنده" && <i />}{match.status}</span>
                  <span>{match.league}</span><span className="dot-divider">•</span><span>{match.insight}</span>
                </div>
                <div className="match-body">
                  <div className="teams">
                    <div><span className="team-badge">{match.home.slice(0, 1)}</span><b>{match.home}</b></div>
                    <div className="match-time">{match.score ? <strong>{match.score}</strong> : <strong>{match.time}</strong>}<small>{match.minute ?? "شروع مسابقه"}</small></div>
                    <div><b>{match.away}</b><span className="team-badge muted">{match.away.slice(0, 1)}</span></div>
                  </div>
                  <div className="market-row">
                    {match.markets.map((market) => {
                      const isSelected = selections.some((selection) => selection.id === `${match.id}-${market.label}`);
                      return <button onClick={() => addSelection(match, market)} key={market.label} className={`odds-button ${isSelected ? "chosen" : ""} ${market.odds === 0 ? "more" : ""}`}>
                        <span>{market.label}</span><b>{market.odds ? numberFa(market.odds) : <Plus size={17} />}</b>
                      </button>;
                    })}
                  </div>
                </div>
              </article>
            ))}
          </div>
          <button className="show-more" onClick={() => toast.info("تقویم کامل مسابقات در حال آماده‌سازی است.")}>نمایش مسابقات بیشتر <ChevronDown size={17} /></button>
        </div>

        <aside className={`slip-card glass-panel ${slipOpen ? "mobile-open" : ""}`} aria-label="بلیت پیش‌بینی">
          <div className="slip-head"><div><ReceiptText size={20} /><h3>بلیت پیش‌بینی</h3><span>{selections.length} انتخاب</span></div><button onClick={() => setSelections([])} disabled={!selections.length}>پاک‌سازی</button></div>
          {selections.length === 0 ? (
            <div className="slip-empty"><div><LayoutGrid size={25} /></div><b>بلیت شما خالی است</b><p>روی یک ضریب از مسابقات بزنید تا اینجا ظاهر شود.</p></div>
          ) : (
            <>
              <div className="selection-list">
                {selections.map((selection) => <div className="selection" key={selection.id}><button onClick={() => setSelections((items) => items.filter((item) => item.id !== selection.id))} aria-label="حذف انتخاب"><X size={15} /></button><div><b>{selection.market}</b><span>{selection.match}</span></div><strong>{numberFa(selection.odds)}</strong></div>)}
              </div>
              <div className="slip-stats"><span>ضریب ترکیبی</span><b>{numberFa(odds)}</b></div>
              <label className="stake-input"><span>مبلغ پیش‌بینی</span><div><input inputMode="decimal" value={stake} onChange={(event) => setStake(event.target.value)} aria-label="مبلغ به USDT"/><em>USDT</em></div></label>
              {!stakeValid && stake && <p className="input-error">حداقل مبلغ ۱ USDT و حداکثر برابر موجودی شماست.</p>}
              <div className="return-box"><span>بازده احتمالی</span><b>{numberFa(potentialReturn)} <small>USDT</small></b></div>
              <Button className="ticket-button" onClick={showTicket}>بررسی بلیت <ArrowLeft size={17} /></Button>
            </>
          )}
          <p className="slip-note"><ShieldCheck size={14} /> با ادامه، شرایط استفاده و بازی مسئولانه را می‌پذیرید.</p>
        </aside>
      </section>

      <section className="wallet-section container" id="wallet">
        <div className="section-heading"><div><span className="section-kicker">دارایی‌های شما</span><h2>کیف پول، شفاف و تحت کنترل شما</h2></div><button className="text-link" onClick={() => scrollTo("account")}>همهٔ تراکنش‌ها <ArrowLeft size={16} /></button></div>
        <div className="wallet-layout">
          <div className="balance-overview glass-panel">
            <div className="wallet-card-top"><span className="wallet-logo"><WalletCards size={22} /></span><div><span>کیف پول اصلی</span><b>USDT <small>· Tether</small></b></div><button><Eye size={18} /></button></div>
            <div className="total-balance"><span>موجودی کل</span><strong>{numberFa(availableBalance + lockedBalance)} <small>USDT</small></strong><em>≈ {numberFa((availableBalance + lockedBalance) * 1.0, 0)} دلار آمریکا</em></div>
            <div className="balance-breakdown"><div><span>قابل‌استفاده</span><b>{numberFa(availableBalance)} USDT</b><i className="positive" /></div><div><span>قفل‌شده در شرط‌های باز</span><b>{numberFa(lockedBalance)} USDT</b><i className="locked" /></div></div>
            <div className="wallet-actions"><button onClick={() => scrollTo("deposit")}><ArrowDownLeft size={18} /> واریز</button><button onClick={() => scrollTo("withdraw")}><ArrowUpRight size={18} /> برداشت</button><button onClick={() => toast.info("تبدیل ارز به‌زودی افزوده می‌شود.")}><Diamond size={18} /> تبدیل</button></div>
          </div>

          <div className="deposit-panel glass-panel" id="deposit">
            <div className="panel-title"><div><span className="section-kicker">واریز USDT</span><h3>یک شبکه را انتخاب کنید</h3></div><span className="secure-chip"><ShieldCheck size={14} /> امن</span></div>
            <div className="network-tabs">{(Object.keys(networkInfo) as (keyof typeof networkInfo)[]).map((item) => <button key={item} className={network === item ? "active" : ""} onClick={() => setNetwork(item)}>{item}</button>)}</div>
            <div className="address-box"><div><span>آدرس واریز شما</span><b dir="ltr">{networkInfo[network].address}</b></div><button onClick={() => { navigator.clipboard?.writeText(networkInfo[network].address); toast.success("آدرس شبکه کپی شد."); }} aria-label="کپی آدرس"><Copy size={18} /></button></div>
            <div className="network-detail"><span><Clock3 size={15} /> واریز پس از {networkInfo[network].confirmations}</span><span>کارمزد شبکه: {networkInfo[network].fee}</span></div>
            <p className="wallet-warning"><CircleHelp size={15} /> فقط USDT روی شبکهٔ انتخاب‌شده را به این آدرس ارسال کنید.</p>
          </div>

          <div className="withdraw-panel glass-panel" id="withdraw">
            <div className="panel-title"><div><span className="section-kicker">برداشت</span><h3>ارسال امن USDT</h3></div><LockKeyhole size={19} /></div>
            <div className="withdraw-fields"><label><span>شبکهٔ مقصد</span><select value={network} onChange={(event) => setNetwork(event.target.value as keyof typeof networkInfo)}>{Object.keys(networkInfo).map((item) => <option key={item}>{item}</option>)}</select></label><label><span>مبلغ</span><div className="compact-input"><input value={withdrawAmount} onChange={(event) => setWithdrawAmount(event.target.value)} inputMode="decimal" placeholder="حداقل ۱۰"/><em>USDT</em></div></label><label><span>آدرس مقصد</span><input value={withdrawAddress} onChange={(event) => setWithdrawAddress(event.target.value)} dir="ltr" placeholder="آدرس کیف پول مقصد"/></label></div>
            <Button className="withdraw-button" onClick={requestWithdrawal}>ثبت درخواست برداشت <ArrowLeft size={16} /></Button>
          </div>
        </div>
      </section>

      <section className="account-section container" id="account">
        <div className="section-heading"><div><span className="section-kicker">فضای شخصی شما</span><h2>مرور سریع حساب کاربری</h2></div><button className="text-link" onClick={() => toast.info("مرکز پشتیبانی در نسخهٔ بعدی در دسترس قرار می‌گیرد.")}><Headphones size={16} /> پشتیبانی</button></div>
        <div className="account-grid">
          <article className="account-card glass-panel open-bets"><div className="card-header"><span className="icon-surface violet"><FileClock size={19} /></span><div><span>شرط‌های باز</span><b>۲ بلیت فعال</b></div><button><ArrowLeft size={16} /></button></div><div className="open-bet-line"><div><span>رئال مادرید — بارسلونا</span><b>برد رئال مادرید</b></div><strong>۲٫۰۴</strong></div><div className="open-bet-footer"><span>مبلغ: ۵۰ USDT</span><span>بازده: ۱۰۲ USDT</span></div></article>
          <article className="account-card glass-panel"><div className="card-header"><span className="icon-surface mint"><Landmark size={19} /></span><div><span>فعالیت کیف پول</span><b>امروز</b></div><button><ArrowLeft size={16} /></button></div><div className="activity-line"><div className="activity-icon incoming"><ArrowDownLeft size={15} /></div><div><b>واریز USDT</b><span>TRC-20 · تأییدشده</span></div><strong className="income">+۲۵۰٫۰۰</strong></div><div className="activity-line"><div className="activity-icon outgoing"><ArrowUpRight size={15} /></div><div><b>ورودی شرط باز</b><span>قفل‌شده</span></div><strong>−۵۰٫۰۰</strong></div></article>
          <article className="account-card glass-panel safety-card"><div className="card-header"><span className="icon-surface gold"><ShieldCheck size={19} /></span><div><span>امنیت و مسئولیت‌پذیری</span><b>حساب محافظت‌شده</b></div></div><div className="safety-items"><button onClick={() => toast.info("مدیریت محدودیت‌ها در پنل کاربری قابل تنظیم است.")}><span><Settings2 size={16} /> تنظیم محدودیت‌ها</span><ArrowLeft size={15} /></button><button onClick={() => toast.info("تنظیمات امنیتی و ورود دومرحله‌ای به‌زودی کامل می‌شود.")}><span><LockKeyhole size={16} /> تنظیمات امنیتی</span><ArrowLeft size={15} /></button></div></article>
        </div>
      </section>

      <section className="responsible container">
        <div className="responsible-icon"><ShieldCheck size={22} /></div><div><b>پیش‌بینی آگاهانه شروع می‌شود.</b><p>برای خودتان حد تعیین کنید و در صورت نیاز، دسترسی به بازی را موقتاً متوقف کنید.</p></div><button onClick={() => toast.info("مرکز بازی مسئولانه آمادهٔ تنظیم محدودیت‌هاست.")}>بازی مسئولانه <ArrowLeft size={16} /></button>
      </section>

      <footer className="site-footer container"><div className="footer-brand"><span className="brand-mark">N</span><b>NEXUS BET</b><p>تجربهٔ نوین پیش‌بینی ورزشی با USDT</p></div><div className="footer-links"><a href="#discover">مسابقات</a><a href="#wallet">کیف پول</a><button onClick={() => setAgeOpen(true)}>قوانین و ریسک</button><button onClick={() => toast.info("شرایط استفاده در نسخهٔ حقوقی نهایی قرار می‌گیرد.")}>شرایط استفاده</button></div><span className="age-mark">+۱۸</span></footer>

      <button className="mobile-slip-trigger" onClick={() => setSlipOpen(true)} aria-label="باز کردن بلیت"><ReceiptText size={18} /><span>{selections.length ? selections.length : "بلیت"}</span></button>

      {ageOpen && <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="تأیید سن"><div className="age-modal glass-panel"><button className="modal-close" onClick={() => setAgeOpen(false)} aria-label="بستن"><X size={18} /></button><div className="age-icon"><ShieldCheck size={25} /></div><span className="section-kicker">NEXUS CARE</span><h2>پیش از شروع، یک تأیید کوتاه</h2><p>این سرویس فقط برای افراد بالای ۱۸ سال است. لطفاً با آگاهی از ریسک مالی و مسئولیت شخصی ادامه دهید.</p><Button className="age-confirm" onClick={() => { setAgeAccepted(true); setAgeOpen(false); toast.success("تأیید شما ثبت شد. با آگاهی پیش بروید."); }}><Check size={17} /> بالای ۱۸ سال هستم و می‌پذیرم</Button><button className="age-limit" onClick={() => toast.info("می‌توانید برای دریافت راهنمایی با پشتیبانی تماس بگیرید.")}>مدیریت محدودیت‌ها و بازی مسئولانه</button></div></div>}

      {ticketOpen && <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="خلاصه بلیت"><div className="ticket-modal glass-panel"><button className="modal-close" onClick={() => setTicketOpen(false)} aria-label="بستن"><X size={18} /></button><div className="ticket-success"><Check size={20} /></div><span className="section-kicker">بازبینی نهایی</span><h2>بلیت شما آمادهٔ ثبت است</h2><div className="ticket-summary">{selections.map((selection) => <div key={selection.id}><span>{selection.market}<small>{selection.match}</small></span><b>{numberFa(selection.odds)}</b></div>)}</div><div className="ticket-total"><span>مبلغ</span><b>{numberFa(numericStake)} USDT</b><span>بازده احتمالی</span><strong>{numberFa(potentialReturn)} USDT</strong></div><Button className="age-confirm" onClick={confirmTicket}>تأیید و ثبت بلیت <ArrowLeft size={17} /></Button><p>پس از ثبت، بلیت در بخش شرط‌های باز قابل پیگیری است.</p></div></div>}
    </main>
  );
}
