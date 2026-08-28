import { useState } from "react";
import { ArrowLeft, History, Play, ShieldCheck, Zap } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { openAuthModal } from "@/lib/platformOverlay";
import { formatCrashAmount, formatCrashCashoutLabel, formatCrashStakeLabel } from "@shared/sportsDisplay";

const fa = (value: number) => formatCrashAmount(value);

export default function Crash() {
  const { isAuthenticated } = useAuth();
  const [stake, setStake] = useState("10");
  const [betId, setBetId] = useState<number | null>(null);
  const roundQuery = trpc.crash.current.useQuery(undefined, { refetchInterval: 1000 });
  const historyQuery = trpc.crash.history.useQuery(undefined, { refetchInterval: 5000 });
  const utils = trpc.useUtils();
  const placeMutation = trpc.crash.place.useMutation({ onSuccess: (data) => setBetId(data.id) });
  const cashoutMutation = trpc.crash.cashout.useMutation({ onSuccess: () => { setBetId(null); void utils.wallet.me.invalidate(); void historyQuery.refetch(); } });
  const round = roundQuery.data;
  const multiplier = round?.currentMultiplier ?? 1;
  const currentStake = Number(stake) || 0;
  const payout = currentStake * multiplier;
  const submitBet = () => { if (!isAuthenticated) return openAuthModal(); if (!round || currentStake < 1) return; placeMutation.mutate({ roundId: round.id, stake: currentStake }); };
  const submitCashout = () => { if (betId) cashoutMutation.mutate({ betId }); };
  const pending = placeMutation.isPending || cashoutMutation.isPending;

  return <PageShell eyebrow="بازی انفجار" title="ریسک را قبل از توقف ببین" description="ضریب و round از backend خوانده می‌شوند. bet و cashout واقعی‌اند و تغییر موجودی فقط پس از settlement ثبت‌شده انجام می‌شود." heroImage="/manus-storage/nexus-bet-crash-hero-v2_ef7fde4d.png">
    <div className="crash-board glass-panel"><div className="crash-status"><span>{roundQuery.isLoading ? "در حال دریافت round…" : round?.status === "running" ? "دور در حال اجرا" : "دور متوقف شد"}</span><span className="sample-chip">{round?.roundCode ?? "بدون round"}</span></div><div className={`crash-multiplier ${round?.status === "running" ? "pulse" : ""}`}>{fa(multiplier)}<small>×</small></div><div className="crash-rail"><span style={{ width: `${Math.min(92, Math.max(0, (multiplier - 1) * 38))}%` }} /></div><div className="crash-actions"><button className="solid-cta" disabled={pending || !round || round.status !== "running" || Boolean(betId)} onClick={submitBet}>{!isAuthenticated ? "ورود برای بازی" : betId ? "bet ثبت شد" : "ثبت bet"} {betId ? <ShieldCheck size={16} /> : <Play size={16} />}</button><label><span>مبلغ USDT</span><input value={stake} onChange={(event) => setStake(event.target.value)} inputMode="decimal" /></label>{betId && <button className="outline-cta" disabled={pending || round?.status !== "running"} onClick={submitCashout}>cashout {formatCrashCashoutLabel(payout)} <Zap size={15} /></button>}</div>{(placeMutation.error || cashoutMutation.error) && <p className="inline-alert">عملیات انجام نشد؛ موجودی، round و وضعیت bet را بررسی کن.</p>}</div>
    <div className="crash-grid"><article className="standalone-card glass-panel"><History size={19} /><h3>دورهای اخیر</h3>{historyQuery.isLoading ? <p className="data-state">در حال دریافت…</p> : historyQuery.data?.length ? <div className="rounds">{historyQuery.data.map((item) => <span key={item.id}>{fa(item.multiplier)}×</span>)}</div> : <p className="data-state">هنوز round تسویه‌شده‌ای وجود ندارد.</p>}<p>نتایج از جدول crashRounds خوانده می‌شوند.</p></article><article className="standalone-card glass-panel"><ShieldCheck size={19} /><h3>بت‌اسلیپ انفجار</h3><div className="crash-slip-row"><span>مبلغ</span><b>{formatCrashStakeLabel(currentStake)}</b></div><div className="crash-slip-row"><span>برداشت در ضریب فعلی</span><b className="mint-text">{formatCrashCashoutLabel(payout)}</b></div><p className="data-state">پس از ثبت، وضعیت bet و payout در backend ذخیره می‌شود.</p><button className="outline-cta" disabled={!betId || pending} onClick={submitCashout}>ثبت برداشت <ArrowLeft size={15} /></button></article></div>
  </PageShell>;
}
