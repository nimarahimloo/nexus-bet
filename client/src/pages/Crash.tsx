import { useEffect, useState } from "react";
import { ArrowLeft, History, Play, ShieldCheck, Zap } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { formatCrashAmount, formatCrashCashoutLabel, formatCrashStakeLabel } from "@shared/sportsDisplay";

const fa = (value: number) => formatCrashAmount(value);
export default function Crash() {
  const [multiplier, setMultiplier] = useState(1.42);
  const [running, setRunning] = useState(false);
  const [stake, setStake] = useState("10");
  useEffect(() => { if (!running) return; const timer = window.setInterval(() => setMultiplier((value) => Number((value + .01).toFixed(2))), 180); return () => window.clearInterval(timer); }, [running]);
  const cashout = Number(stake) * multiplier;
  return <PageShell eyebrow="بازی انفجار" title="ریسک را قبل از توقف ببین" description="یک بازی نمایشی برای طراحی تجربه. ضریب بالا می‌رود و ممکن است هر لحظه متوقف شود؛ سود تضمین‌شده‌ای وجود ندارد." heroImage="/manus-storage/nexus-bet-crash-hero-v2_ef7fde4d.png"><div className="crash-board glass-panel"><div className="crash-status"><span>{running ? "دور در حال اجرا" : "آمادهٔ شروع"}</span><span className="sample-chip">نمایشی</span></div><div className={`crash-multiplier ${running ? "pulse" : ""}`}>{fa(multiplier)}<small>×</small></div><div className="crash-rail"><span style={{ width: `${Math.min(92, (multiplier - 1) * 38)}%` }} /></div><div className="crash-actions"><button className="solid-cta" onClick={() => setRunning(!running)}>{running ? "توقف ضریب" : "شروع دور"} {running ? <Zap size={16} /> : <Play size={16} />}</button><label><span>مبلغ USDT</span><input value={stake} onChange={(event) => setStake(event.target.value)} inputMode="decimal" /></label></div></div><div className="crash-grid"><article className="standalone-card glass-panel"><History size={19} /><h3>دورهای اخیر</h3><div className="rounds">{["۱٫۲۱×", "۳٫۸۴×", "۱٫۰۶×", "۷٫۲۵×", "۲٫۰۲×"].map((round) => <span key={round}>{round}</span>)}</div><p>این اعداد نمونه‌اند و از بازی واقعی دریافت نمی‌شوند.</p></article><article className="standalone-card glass-panel"><ShieldCheck size={19} /><h3>بت‌اسلیپ انفجار</h3><div className="crash-slip-row"><span>مبلغ</span><b>{formatCrashStakeLabel(Number(stake) || 0)}</b></div><div className="crash-slip-row"><span>برداشت در ضریب فعلی</span><b className="mint-text">{formatCrashCashoutLabel(cashout)}</b></div><button className="outline-cta" onClick={() => setRunning(false)}>ثبت برداشت <ArrowLeft size={15} /></button></article></div></PageShell>;
}
