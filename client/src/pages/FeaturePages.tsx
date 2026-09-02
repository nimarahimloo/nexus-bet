import { ArrowLeft, BadgePercent, CircleCheck, CircleHelp, Gift, Layers3, Loader2, LockKeyhole, Trophy, WalletCards, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";
import { openAuthModal } from "@/lib/platformOverlay";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { formatFaDecimal } from "@shared/format";
import { PageShell } from "@/components/PageShell";
const wheelPalette = ["#893bff", "#5fe2d0", "#ab71ff", "#f4c96c", "#6d3fd1", "#51b9ad"];

const featureCards = [
  { title: "مسابقات زنده", detail: "فید رسمی و لحظه‌ای.", icon: Trophy, href: "/matches", image: "/manus-storage/nexus-bet-live-match_f1d157ef.jpg" },
  { title: "فوتبال", detail: "بازارهای خوانا و سریع.", icon: Trophy, href: "/matches", image: "/manus-storage/nexus-bet-matches-hero-v2_fbfab850.png" },
  { title: "انفجار", detail: "ضریب زنده، کنترل با تو.", icon: Zap, href: "/crash", image: "/manus-storage/nexus-bet-crash-hero-v2_ef7fde4d.png" },
  { title: "پاداش‌ها", detail: "گردونه و فعالیت روزانه.", icon: Gift, href: "/rewards", image: "/manus-storage/nexus-bet-rewards-hero-v3_92731f27.png" },
  { title: "باشگاه VIP", detail: "سطح و مزایای روشن.", icon: BadgePercent, href: "/vip", image: "/manus-storage/nexus-bet-vip-hero-v2_6e37762c.png" },
  { title: "کیف پول چندارزی", detail: "USDT پایه؛ دارایی‌های رایج در یکجا.", icon: WalletCards, href: "/wallet", image: "/manus-storage/nexus-bet-wallet-hero-v2_884a12f2.png" },
];

function OperationalEmpty({ title, detail, href = "/matches", cta = "بازگشت به مسابقات" }: { title: string; detail: string; href?: string; cta?: string }) {
  return <div className="empty-state glass-panel operational-empty"><span className="empty-state-icon"><LockKeyhole size={21} /></span><h2>{title}</h2><p>{detail}</p><Link href={href} className="outline-cta">{cta} <Zap size={15} /></Link></div>;
}

export function PromotionsPage() {
  const promotionsQuery = trpc.promotions.active.useQuery();
  const claimMutation = trpc.promotions.claim.useMutation({ onSuccess: () => { toast.success("پیشنهاد فعال شد."); void promotionsQuery.refetch(); }, onError: (error) => toast.error(error.message) });
  const promotions = promotionsQuery.data ?? [];
  return <PageShell title="پیشنهادها" heroImage="/manus-storage/nexus-bet-promotions-hero-v3_65559fc7.png">
    {promotionsQuery.error && <div className="inline-alert">کمپین‌ها فعلاً از backend دریافت نشدند.</div>}
    {promotionsQuery.isLoading ? <div className="empty-state glass-panel">در حال دریافت…</div> : promotions.length ? <div className="offer-grid">{promotions.map((promotion) => <article className="offer-card glass-panel" key={promotion.id}><span className="sample-chip">{promotion.rewardType.toUpperCase()}</span><h2>{promotion.title}</h2><p>{promotion.description}</p><small>{promotion.terms}</small><div className="offer-card-footer"><span>تا {new Date(promotion.endsAt).toLocaleDateString("fa-IR")}</span><button className="solid-cta" disabled={claimMutation.isPending} onClick={() => claimMutation.mutate({ promotionId: promotion.id })}>فعال‌سازی <ArrowLeft size={15} /></button></div></article>)}</div> : <OperationalEmpty title="کمپین فعال پیدا نشد" detail="در حال حاضر کمپین فعالی وجود ندارد." />}
    
  </PageShell>;
}

export function TournamentsPage() {
  const tournamentsQuery = trpc.tournaments.active.useQuery();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const tournaments = tournamentsQuery.data ?? [];
  const selected = tournaments.find((item) => item.id === (selectedId ?? tournaments[0]?.id));
  const leaderboardQuery = trpc.tournaments.leaderboard.useQuery({ tournamentId: selected?.id ?? 0 }, { enabled: Boolean(selected?.id) });
  return <PageShell eyebrow="رقابت‌ها" title="رقابت را با جدول واقعی شروع کن" description="رتبه‌بندی، امتیاز، جایزه و قوانین از جدول‌های backend خوانده می‌شوند؛ هیچ participant یا prize pool ساختگی ساخته نمی‌شود." heroImage="/manus-storage/nexus-bet-tournaments-hero-v3_d13dd980.png">
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
  const activityQuery = trpc.rewards.activity.useQuery(undefined, { enabled: isAuthenticated });
  const activityMutation = trpc.rewards.claimActivity.useMutation({
    onSuccess: () => { toast.success("پاداش فعالیت ثبت شد."); void activityQuery.refetch(); void utils.wallet.me.invalidate(); void utils.notifications.unreadCount.invalidate(); }, onError: (error) => toast.error(error.message),
  });
  const spinMutation = trpc.rewards.spin.useMutation({
    onSuccess: (data) => {
      setRotation((value) => value + 1440 + Math.floor(Math.random() * 360));
      setTimeout(() => setResult(data.reward), 850);
      void utils.rewards.status.invalidate();
      void utils.rewards.history.invalidate();
      void utils.wallet.me.invalidate();
      toast.success("نتیجهٔ گردونه ثبت شد.");
    },
    onError: (error) => toast.error(error.message),
  });
  const segments = segmentsQuery.data?.segments ?? [];
  const history = historyQuery.data ?? [];
  const wheelIsReady = segments.length > 0;
  const canSpin = isAuthenticated && wheelIsReady && Boolean(statusQuery.data?.canSpin) && !spinMutation.isPending;
  const wheelGradient = wheelIsReady ? `conic-gradient(from -${360 / segments.length / 2}deg, ${segments.map((_, index) => `${wheelPalette[index % wheelPalette.length]} ${(index / segments.length) * 100}% ${((index + 1) / segments.length) * 100}%`).join(", ")})` : undefined;

  return <PageShell title="هر روز، یک شانس واقعی" heroImage="/manus-storage/nexus-bet-rewards-hero-v3_92731f27.png">
    <div className="reward-wheel-card glass-panel">
      <div className="wheel-visual" aria-label="گردونهٔ شانس">{segmentsQuery.isLoading ? <div className="wheel-loading"><Loader2 className="spin" size={28} /><span>در حال بارگذاری گردونه…</span></div> : segmentsQuery.error || !wheelIsReady ? <div className="wheel-loading"><CircleHelp size={28} /><span>گردونه موقتاً در دسترس نیست.</span><button type="button" className="outline-cta" onClick={() => void segmentsQuery.refetch()}>تلاش دوباره</button></div> : <><div className="wheel-pointer" /><div className="wheel-disc" style={{ transform: `rotate(${rotation}deg)`, background: wheelGradient }}>{segments.map((segment, index) => <span key={segment.code} style={{ transform: `rotate(${index * (360 / Math.max(segments.length, 1))}deg)` }}>{segment.label}</span>)}</div><div className="wheel-core"><Gift size={28} /><span aria-live="polite">{spinMutation.isPending ? "در حال چرخش…" : result?.label ?? "یک بار در روز"}</span></div></>}</div>
      <div className="wheel-copy"><span className="sample-chip">{isAuthenticated ? (statusQuery.data?.canSpin ? "امروز آماده‌ای" : "امروز استفاده شد") : "نیازمند ورود"}</span><h2>{result ? result.type === "usdt" ? `${formatFaDecimal(result.amount)} USDT به کیف پولت اضافه شد` : result.label : "شانس روزانه"}</h2><p>{result ? "ثبت شد و در تاریخچه است." : "نتیجه در backend؛ پاداش مستقیماً به wallet."}</p><div className="wheel-actions"><button className="primary-cta" disabled={!canSpin} onClick={() => isAuthenticated ? spinMutation.mutate() : openAuthModal()}>{!isAuthenticated ? "ورود برای چرخاندن" : !wheelIsReady ? "گردونه در دسترس نیست" : spinMutation.isPending ? "در حال ثبت نتیجه…" : statusQuery.data?.canSpin ? "چرخاندن گردونه" : "فردا دوباره امتحان کن"} {!isAuthenticated ? <LockKeyhole size={15} /> : <Gift size={15} />}</button>{!isAuthenticated && <button className="text-link" onClick={() => openAuthModal()}>ورود به Nexus Bet <ArrowLeft size={15} /></button>}</div>{spinMutation.error && <p className="inline-alert">{spinMutation.error.message}</p>}</div>
    </div>
    <div className="activity-reward-card glass-panel"><div className="section-heading"><div><h2>امتیاز روزانه</h2></div><span className="sample-chip">سقف روزانه</span></div><p className="data-state">پاداش محدود برای فعالیت مسئولانه؛ مستقل از مبلغ شرط.</p>{!isAuthenticated ? <p className="data-state">برای دریافت پاداش، وارد حساب شو.</p> : activityQuery.isLoading ? <p className="data-state">در حال دریافت فعالیت‌های امروز…</p> : <div className="activity-task-list">{(activityQuery.data?.tasks ?? []).map((task) => <div className="activity-task-row" key={task.code}><div><b>{task.label}</b><span>{task.description}</span></div><strong>{formatFaDecimal(task.amount)} USDT</strong><button className="outline-cta" disabled={task.claimed || activityMutation.isPending} onClick={() => activityMutation.mutate({ activityCode: task.code })}>{task.claimed ? "دریافت شد" : activityMutation.isPending ? "در حال ثبت…" : "دریافت پاداش"}</button></div>)}</div>}{activityMutation.error && <p className="inline-alert">{activityMutation.error.message}</p>}</div>
    {wheelIsReady && <div className="reward-odds glass-panel"><div className="section-heading"><div><h2>احتمال هر جایزه</h2></div><span className="sample-chip">۱۰۰٪ مجموع</span></div><p className="data-state">احتمال‌ها پیش از spin نمایش داده می‌شوند.</p><div className="reward-odds-list">{segments.map((segment) => <div className="reward-odds-row" key={segment.code}><span>{segment.label}</span><strong>{formatFaDecimal(segment.chancePercent, segment.chancePercent % 1 ? 1 : 0)}٪</strong><i><b style={{ width: `${segment.chancePercent}%` }} /></i></div>)}</div></div>}
    <div className="reward-history glass-panel"><div className="section-heading"><div><h2>تاریخچهٔ گردونه</h2></div><span className="sample-chip">{history.length ? `${formatFaDecimal(history.length, 0)} spin` : "خالی"}</span></div>{!isAuthenticated ? <p className="data-state">برای دیدن تاریخچه وارد حساب شوید.</p> : historyQuery.isLoading ? <p className="data-state">در حال دریافت تاریخچه…</p> : history.length ? <div className="reward-history-list">{history.map((spin) => <div className="reward-history-row" key={spin.id}><Gift size={17} /><div><b>{spin.rewardLabel}</b><span>{new Date(spin.createdAt).toLocaleString("fa-IR")}</span></div><strong>{spin.rewardAmount > 0 ? `${formatFaDecimal(spin.rewardAmount)} USDT` : "بدون پاداش"}</strong></div>)}</div> : <p className="data-state">هنوز spin ثبت‌شده‌ای نداری.</p>}</div>
  </PageShell>;
}

export function CasinoPage() {
  const catalogQuery = trpc.games.catalog.useQuery();
  const games = catalogQuery.data ?? [];
  return <PageShell title="بازی‌ها" heroImage="/manus-storage/nexus-bet-casino-hero-v3_e26e607d.png">
    {catalogQuery.isLoading ? <div className="empty-state glass-panel">در حال دریافت…</div> : games.length ? <div className="game-grid">{games.map((game) => <article className="game-card glass-panel" key={game.id}><div className="game-card-icon"><Zap size={21} /></div><span>{game.provider}</span><h3>{game.title}</h3><p>وضعیت: {game.status}</p><a href={game.launchUrl} className="outline-cta">ورود به بازی <Zap size={15} /></a></article>)}</div> : <OperationalEmpty title="بازی فعالی در catalog نیست" detail="در حال حاضر بازی فعالی وجود ندارد." />}
    
  </PageShell>;
}

export function FeatureHub() {
  return <section className="feature-hub container" aria-labelledby="feature-hub-title"><div className="section-heading"><div><h2 id="feature-hub-title">انتخاب سریع</h2></div><Link href="/matches" className="text-link">همه بخش‌ها <Zap size={15} /></Link></div><div className="feature-hub-grid">{featureCards.map(({ title, detail, icon: Icon, href, image }) => <Link className="feature-hub-card glass-panel" href={href} key={title}><img className="feature-hub-art" src={image} alt="" /><span className="feature-hub-icon"><Icon size={19} /></span><div className="feature-hub-copy"><h3>{title}</h3><p>{detail}</p></div><Zap className="feature-hub-arrow" size={17} /></Link>)}</div></section>;
}
