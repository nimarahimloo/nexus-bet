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
  currency?: string;
  onCurrencyChange?: (value: string) => void;
  currencyOptions?: Array<{ code: string; symbol: string; availableBalance: number }>;
  stakeSuggestion?: { suggestedStake: number; maxStake: number; profileLabel: string; reason: string } | null;
  onApplyStakeSuggestion?: (value: string) => void;
};

export function BetSheet({
  selections,
  stake,
  setStake,
  odds,
  open,
  onClose,
  onSubmit,
  canSubmit,
  statusMessage = null,
  isSubmitting = false,
  successCode = null,
  currency = "USDT",
  onCurrencyChange,
  currencyOptions = [],
  stakeSuggestion = null,
  onApplyStakeSuggestion,
}: BetSheetProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    // Lock body scroll while sheet is open (mobile)
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  const numericStake = Number(stake.replace(",", ".")) || 0;
  const potentialReturn = Number((numericStake * odds).toFixed(2));

  const closeFromBackdrop = (event: React.SyntheticEvent) => {
    if (event.target === event.currentTarget) onClose();
  };

  return (
    <div
      className="bet-sheet-layer"
      role="presentation"
      onClick={closeFromBackdrop}
      onPointerDown={closeFromBackdrop}
    >
      <section
        className="bet-sheet glass-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bet-sheet-title"
        onClick={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <div className="sheet-handle" aria-hidden="true" />
        <div className="prediction-sheet-head">
          <div>
            <span className="section-kicker">بلیت پیش‌بینی</span>
            <h2 id="bet-sheet-title">انتخاب‌های تو</h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="بستن بلیت">
            <X size={18} />
          </button>
        </div>
        <div className="sheet-selections">
          {selections.length ? (
            selections.map((selection) => (
              <div className="sheet-selection" key={selection.id}>
                <div>
                  <b>{selection.market}</b>
                  <span>{selection.match}</span>
                </div>
                <strong>{formatFaDecimal(selection.odds)}</strong>
              </div>
            ))
          ) : (
            <div className="sheet-empty">هنوز انتخابی نداری؛ یک بازار را از مسابقات انتخاب کن.</div>
          )}
        </div>
        <div className="sheet-summary">
          <div>
            <span>ضریب ترکیبی</span>
            <b>{formatFaDecimal(odds)}</b>
          </div>
          <div>
            <span>دارایی و مبلغ</span>
            <label className="sheet-currency-control">
              <select
                value={currency}
                onChange={(event) => onCurrencyChange?.(event.target.value)}
                aria-label="دارایی شرط"
              >
                <option value={currency}>{currency}</option>
                {currencyOptions
                  .filter((item) => item.code !== currency)
                  .map((item) => (
                    <option value={item.code} key={item.code}>
                      {item.symbol}
                    </option>
                  ))}
              </select>
              <input
                value={stake}
                onChange={(event) => setStake(event.target.value)}
                inputMode="decimal"
                enterKeyHint="done"
                autoComplete="off"
                aria-label="مبلغ شرط"
              />
              <em>{currency}</em>
            </label>
          </div>
          <div>
            <span>بازگشت احتمالی</span>
            <strong>
              {formatFaDecimal(potentialReturn)} <small>{currency}</small>
            </strong>
          </div>
        </div>
        {stakeSuggestion && selections.length > 0 && (
          <div className="stake-assistant glass-panel" aria-label="دستیار مبلغ شرط">
            <div><span>دستیار مبلغ</span><b>{stakeSuggestion.profileLabel}</b></div>
            <strong>{formatFaDecimal(stakeSuggestion.suggestedStake)} {currency}</strong>
            <button type="button" onClick={() => onApplyStakeSuggestion?.(String(stakeSuggestion.suggestedStake))}>اعمال پیشنهاد</button>
            <small>{stakeSuggestion.reason} سقف: {formatFaDecimal(stakeSuggestion.maxStake)} {currency}</small>
          </div>
        )}
        {statusMessage && (
          <p className={`sheet-status ${successCode ? "sheet-status-success" : "sheet-status-error"}`}>
            {statusMessage}
          </p>
        )}
        {successCode && (
          <p className="sheet-status sheet-status-success">بلیت با موفقیت ثبت شد · {successCode}</p>
        )}
        <button
          type="button"
          className="sheet-submit"
          onClick={onSubmit}
          disabled={!canSubmit || isSubmitting}
        >
          {isSubmitting ? "در حال ثبت بلیت…" : successCode ? "بلیت ثبت شد" : "ادامه و بررسی بلیت"}
          {!isSubmitting && !successCode && <ArrowLeft size={16} />}
        </button>
        <p className="sheet-note">
          مبلغ و ضریب را پیش از ثبت بررسی کن. موجودی {currency} بررسی می‌شود؛ نتیجهٔ شرط تضمین‌شده نیست.
        </p>
      </section>
    </div>
  );
}
