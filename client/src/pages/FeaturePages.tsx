import { ArrowLeft, BadgePercent, CircleCheck, CircleHelp, Gift, Layers3, LockKeyhole, ShieldCheck, Trophy, WalletCards, Zap } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { formatFaDecimal } from "@shared/format";
import { PageShell } from "@/components/PageShell";
import { getDataSourceLabel } from "@shared/dataTruth";

function PreviewNotice({ label }: { label: string }) {
  return <div className="data-state preview-notice"><ShieldCheck size={15} /><span>{label} · {getDataSourceLabel("demo")}؛ تا اتصال backend و ledger واقعی، هیچ رکورد یا موجودی عملیاتی از این بخش ساخته نمی‌شود.</span></div>;
}

const featureCards = [
  { title: "بونوس‌های فعال", detail: "پیشنهادها را فقط با شرایط معتبر و قابل‌پیگیری ببین.", icon: BadgePercent, href: "/promotions" },
  { title: "تورنمنت‌ها", detail: "رقابت‌ها پس از اتصال جدول امتیاز و قوانین رسمی نمایش داده می‌شوند.", icon: Trophy, href: "/tournaments" },
  { title: "گردونهٔ روزانه", detail: "یک spin واقعی در روز؛ نتیجه و پاداش در ledger ثبت می‌شود.", icon: Gift, href: "/rewards" },
  { title: "کازینو و بازی‌ها", detail: "بازی‌های قابل‌ورود باید از catalog واقعی سرویس خوانده شوند.", icon: Layers3, href: "/casino" },
];

function OperationalEmpty({ title, detail, href = "/matches", cta = "بازگشت به مسابقات" }: { title: string; detail: string; href?: string; cta?: string }) {
  return <div className="empty-state glass-panel operational-empty"><span className="empty-state-icon"><LockKeyhole size={21} /></span><h2>{title}</h2><p>{detail}</p><Link href={href} className="outline-cta">{cta} <Zap size={15} /></Link></div>;
}

export function PromotionsPage() {
  const promotionsQuery = trpc.promotions.active.useQuery();
  const claimMutation = trpc.promotions.claim.useMutation({ onSuccess: () => void promotionsQuery.refetch() });
  const promotions = promotionsQuery.data ?? [];
  return <PageShell eyebrow="پیشنهادها" title="پیشنهاد معتبر، نه کارت تزئینی" description="کمپین‌ها، شرایط و مهلت از دیتابیس backend خوانده می‌شوند و فعال‌سازی هر پیشنهاد قابل‌ردیابی است." heroImage="/manus-storage/nexus-bet-ai-hero-v2_ad9c88ae.png">
    {promotionsQuery.error && <div className="inline-alert">کمپین‌ها فعلاً از backend دریافت نشدند.</div>}
    {promotionsQuery.isLoading ? <div className="empty-state glass-panel">در حال دریافت کمپین‌های فعال…</div> : promotions.length ? <div className="offer-grid">{promotions.map((promotion) => <article className="offer-card glass-panel" key={promotion.id}><span className="sample-chip">{promotion.rewardType.toUpperCase()}</span><h2>{promotion.title}</h2><p>{promotion.description}</p><small>{promotion.terms}</small><div className="offer-card-footer"><span>تا {new Date(promotion.endsAt).toLocaleDateString("fa-IR")}</span><button className="solid-cta" disabled={claimMutation.isPending} onClick={() => claimMutation.mutate({ promotionId: promotion.id })}>فعال‌سازی <ArrowLeft size={15} /></button></div></article>)}</div> : <OperationalEmpty title="کمپین فعال پیدا نشد" detail="هیچ کمپین فعالی در دیتابیس وجود ندارد؛ این صفحه عمداً مبلغ یا درصد ساختگی نمایش نمی‌دهد." />}
    <div className="responsible-inline"><ShieldCheck size={17} /><span>هر کمپین باید از backend، با شرایط و مهلت معتبر منتشر شود.</span></div>
  </PageShell>;
}

export function TournamentsPage() {
  const tournamentsQuery = trpc.tournaments.active.useQuery();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const tournaments = tournamentsQuery.data ?? [];
  const selected = tournaments.find((item) => item.id === (selectedId ?? tournaments[0]?.id));
  const leaderboardQuery = trpc.tournaments.leaderboard.useQuery({ tournamentId: selected?.id ?? 0 }, { enabled: Boolean(selected?.id) });
  return <PageShell eyebrow="رقابت‌ها" title="رقابت را با جدول واقعی شروع کن" description="رتبه‌بندی، امتیاز، جایزه و قوانین از جدول‌های backend خوانده می‌شوند؛ هیچ participant یا prize pool ساختگی ساخته نمی‌شود." heroImage="/manus-storage/nexus-bet-matches-hero-v2_fbfab850.png">
    {tournamentsQuery.isLoading ? <div className="empty-state glass-panel">در حال دریافت رقابت‌ها…</div> : tournaments.length ? <><div className="feature-filter-row">{tournaments.map((tournament) => <button className={selected?.id === tournament.id ? "selected" : ""} key={tournament.id} onClick={() => setSelectedId(tournament.id)}>{tournament.title}</button>)}</div>{selected && <div className="tournament-feature glass-panel"><div><span className="sample-chip">{selected.status}</span><h2>{selected.title}</h2><p>{selected.description}</p><small>{selected.rules}</small></div><strong>{formatFaDecimal(Number(selected.prizePool))} {selected.currency}</strong></div>}<div className="standings-grid">{leaderboardQuery.data?.map((entry) => <article className="standings-card glass-panel" key={entry.id}><b>{entry.rank ?? "—"}</b><span>{entry.userName}</span><strong>{formatFaDecimal(entry.points)}</strong></article>)}</div>{selected && !leaderboardQuery.data?.length && <div className="empty-state glass-panel">هنوز ورودی یا امتیاز ثبت‌شده‌ای برای این رقابت وجود ندارد.</div>}</> : <OperationalEmpty title="تورنمنت فعال پیدا نشد" detail="داده‌ای از جدول tournaments در backend منتشر نشده است." />}
  </PageShell>;
}

export function RewardsPage() {
  const { isAuthenticated } = useAuth();
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<{ label: string; amount: number; type: "none" | "usdt" } | null>(null);
  const utils = trpc.useUtils();
  const segmentsQuery = trpc.rewards.segments.useQuery(undefined, { staleTime: Infinity });
  const statusQuery = trpc.rewards.status.useQuery(undefined, { enabled: isAuthenticated });
  const historyQuery = trpc.rewards.history.useQuery(undefined, { enabled: isAuthenticated });
  const spinMutation = trpc.rewards.spin.useMutation({
    onSuccess: (data) => {
      setRotation((value) => value + 1440 + Math.floor(Math.random() * 360));
      setTimeout(() => setResult(data.reward), 850);
      void utils.rewards.status.invalidate();
      void utils.rewards.history.invalidate();
      void utils.wallet.me.invalidate();
    },
  });
  const segments = segmentsQuery.data?.segments ?? [];
  const history = historyQuery.data ?? [];
  const canSpin = isAuthenticated && Boolean(statusQuery.data?.canSpin) && !spinMutation.isPending;

  return <PageShell eyebrow="پاداش‌ها" title="هر روز، یک شانس واقعی" description="نتیجه در backend تعیین می‌شود، فقط یک spin در روز مجاز است و هر پاداش USDT همراه با رکورد ledger به کیف پول اضافه می‌شود." heroImage="/manus-storage/nexus-bet-ai-hero-v2_ad9c88ae.png">
    <div className="data-state preview-notice"><ShieldCheck size={15} /><span>قوانین روشن: نتیجه قابل‌دستکاری از مرورگر نیست؛ سقف روزانه و سابقهٔ spin از backend خوانده می‌شود.</span></div>
    <div className="reward-wheel-card glass-panel">
      <div className="wheel-visual" aria-label="گردونهٔ شانس"><div className="wheel-pointer" /><div className="wheel-disc" style={{ transform: `rotate(${rotation}deg)` }}>{segments.map((segment, index) => <span key={segment.code} style={{ transform: `rotate(${index * (360 / Math.max(segments.length, 1))}deg)` }}>{segment.label}</span>)}</div><div className="wheel-core"><Gift size={28} /><span>{spinMutation.isPending ? "در حال چرخش…" : result?.label ?? "یک بار در روز"}</span></div></div>
      <div className="wheel-copy"><span className="sample-chip">{isAuthenticated ? (statusQuery.data?.canSpin ? "امروز آماده‌ای" : "امروز استفاده شد") : "نیازمند ورود"}</span><h2>{result ? result.type === "usdt" ? `${formatFaDecimal(result.amount)} USDT به کیف پولت اضافه شد` : result.label : "شانس را به موجودی واقعی وصل کن"}</h2><p>{result ? "نتیجه از backend برگشته و در تاریخچه ثبت شده است." : "نتیجه در سرور انتخاب می‌شود و پاداش نقدی، در صورت برد، اتمیک به موجودی USDT اضافه خواهد شد."}</p><div className="wheel-actions"><button className="primary-cta" disabled={!canSpin} onClick={() => spinMutation.mutate()}>{!isAuthenticated ? "ورود برای چرخاندن" : spinMutation.isPending ? "در حال ثبت نتیجه…" : statusQuery.data?.canSpin ? "چرخاندن گردونه" : "فردا دوباره امتحان کن"} {!isAuthenticated ? <LockKeyhole size={15} /> : <Gift size={15} />}</button>{!isAuthenticated && <button className="text-link" onClick={() => startLogin()}>ورود به Nexus Bet <ArrowLeft size={15} /></button>}</div>{spinMutation.error && <p className="inline-alert">{spinMutation.error.message}</p>}</div>
    </div>
    <div className="reward-history glass-panel"><div className="section-heading"><div><span className="section-kicker">قابل‌پیگیری</span><h2>تاریخچهٔ گردونه</h2></div><span className="sample-chip">{history.length ? `${formatFaDecimal(history.length, 0)} spin` : "خالی"}</span></div>{!isAuthenticated ? <p className="data-state">برای دیدن تاریخچه وارد حساب شوید.</p> : historyQuery.isLoading ? <p className="data-state">در حال دریافت تاریخچه…</p> : history.length ? <div className="reward-history-list">{history.map((spin) => <div className="reward-history-row" key={spin.id}><Gift size={17} /><div><b>{spin.rewardLabel}</b><span>{new Date(spin.createdAt).toLocaleString("fa-IR")}</span></div><strong>{spin.rewardAmount > 0 ? `${formatFaDecimal(spin.rewardAmount)} USDT` : "بدون پاداش"}</strong></div>)}</div> : <p className="data-state">هنوز spin ثبت‌شده‌ای نداری.</p>}</div>
    <div className="reward-rules glass-panel"><CircleHelp size={19} /><div><b>منبع حقیقت پاداش</b><p>نتیجه، محدودیت حساب و هر تغییر موجودی با spin و reward ledger مرتبط ذخیره می‌شوند.</p></div><ShieldCheck size={18} /></div>
  </PageShell>;
}

export function CasinoPage() {
  const catalogQuery = trpc.games.catalog.useQuery();
  const games = catalogQuery.data ?? [];
  return <PageShell eyebrow="مرکز بازی‌ها" title="کتابخانهٔ بازی از catalog واقعی" description="فقط بازی‌هایی نمایش داده می‌شوند که catalog backend آن‌ها را فعال و قابل‌ورود اعلام کرده باشد." heroImage="/manus-storage/nexus-bet-crash-hero-v2_ef7fde4d.png">
    {catalogQuery.isLoading ? <div className="empty-state glass-panel">در حال دریافت catalog بازی‌ها…</div> : games.length ? <div className="game-grid">{games.map((game) => <article className="game-card glass-panel" key={game.id}><div className="game-card-icon"><Zap size={21} /></div><span>{game.provider}</span><h3>{game.title}</h3><p>وضعیت: {game.status}</p><a href={game.launchUrl} className="outline-cta">ورود به بازی <Zap size={15} /></a></article>)}</div> : <OperationalEmpty title="بازی فعالی در catalog نیست" detail="تا زمانی که provider بازی و لینک launch واقعی ثبت نشوند، هیچ کارت بازی ساختگی نمایش داده نمی‌شود." />}
    <div className="responsible-inline"><WalletCards size={17} /><span>catalog و provider هر بازی باید در backend ثبت و قابل‌پیگیری باشد.</span></div>
  </PageShell>;
}

export function FeatureHub() {
  return <section className="feature-hub container" aria-labelledby="feature-hub-title"><div className="section-heading"><div><span className="section-kicker">بیشتر از یک لیست مسابقه</span><h2 id="feature-hub-title">مرکز تجربهٔ Nexus Bet</h2></div><Link href="/promotions" className="text-link">دیدن همه <Zap size={15} /></Link></div><div className="feature-hub-grid">{featureCards.map(({ title, detail, icon: Icon, href }) => <Link className="feature-hub-card glass-panel" href={href} key={title}><span className="feature-hub-icon"><Icon size={19} /></span><div><h3>{title}</h3><p>{detail}</p></div><Zap className="feature-hub-arrow" size={17} /></Link>)}</div></section>;
}
