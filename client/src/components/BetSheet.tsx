import { ArrowLeft, X } from "lucide-react";
import { useEffect } from "react";
import { formatFaDecimal } from "@shared/format";

export type BetSheetSelection = { id: string; match: string; market: string; odds: number };

type BetSheetProps = {
  selections: BetSheetSelection[];
  stake: string;
  setStake: (value: string) => void;
  odds: number;
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  canSubmit: boolean;
  statusMessage?: string | null;
  isSubmitting?: boolean;
  successCode?: string | null;
};

export function BetSheet({ selections, stake, setStake, odds, open, onClose, onSubmit, canSubmit, statusMessage = null, isSubmitting = false, successCode = null }: BetSheetProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;
  const numericStake = Number(stake.replace(",", ".")) || 0;
  const potentialReturn = Number((numericStake * odds).toFixed(2));

  return <div className="bet-sheet-layer" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="bet-sheet glass-panel" role="dialog" aria-modal="true" aria-labelledby="bet-sheet-title"><div className="sheet-handle" aria-hidden="true" /><div className="prediction-sheet-head"><div><span className="section-kicker">بلیت پیش‌بینی</span><h2 id="bet-sheet-title">انتخاب‌های تو</h2></div><button className="modal-close" onClick={onClose} aria-label="بستن بلیت"><X size={18} /></button></div><div className="sheet-selections">{selections.length ? selections.map((selection) => <div className="sheet-selection" key={selection.id}><div><b>{selection.market}</b><span>{selection.match}</span></div><strong>{formatFaDecimal(selection.odds)}</strong></div>) : <div className="sheet-empty">هنوز انتخابی نداری؛ یک بازار را از مسابقات انتخاب کن.</div>}</div><div className="sheet-summary"><div><span>ضریب ترکیبی</span><b>{formatFaDecimal(odds)}</b></div><div><span>مبلغ پیش‌بینی</span><label><input value={stake} onChange={(event) => setStake(event.target.value)} inputMode="decimal" /><em>USDT</em></label></div><div><span>بازگشت احتمالی</span><strong>{formatFaDecimal(potentialReturn)} <small>USDT</small></strong></div></div>{statusMessage && <p className={`sheet-status ${successCode ? "sheet-status-success" : "sheet-status-error"}`}>{statusMessage}</p>}{successCode && <p className="sheet-status sheet-status-success">بلیت با موفقیت ثبت شد · {successCode}</p>}<button className="sheet-submit" onClick={onSubmit} disabled={!canSubmit || isSubmitting}>{isSubmitting ? "در حال ثبت بلیت…" : successCode ? "بلیت ثبت شد" : "ادامه و بررسی بلیت"}{!isSubmitting && !successCode && <ArrowLeft size={16} />}</button><p className="sheet-note">مبلغ و ضریب را پیش از ثبت بررسی کن. نتیجهٔ شرط تضمین‌شده نیست.</p></section></div>;
}
