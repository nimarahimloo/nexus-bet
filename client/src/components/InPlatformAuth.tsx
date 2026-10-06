import { useEffect, useState } from "react";
import { ArrowLeft, CircleHelp, Eye, EyeOff, KeyRound, LoaderCircle, LockKeyhole, UserRound, X } from "lucide-react";
import { type AuthMode } from "@/lib/platformOverlay";
import { trpc } from "@/lib/trpc";

const content: Record<AuthMode, { eyebrow: string; title: string; description: string; action: string }> = {
  login: { eyebrow: "ورود", title: "به حساب برگرد", description: "نام کاربری انگلیسی و رمز عبور را وارد کن.", action: "ورود" },
  signup: { eyebrow: "ثبت‌نام", title: "حساب جدید بساز", description: "نام کاربری ۳–۳۲ کاراکتر انگلیسی؛ رمز حداقل ۸ کاراکتر.", action: "ساخت حساب" },
  forgot: { eyebrow: "بازیابی", title: "بازیابی رمز", description: "نام کاربری را بده تا کد بازیابی بگیری.", action: "دریافت کد" },
};

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "درخواست انجام نشد. دوباره تلاش کن.";
}

export function InPlatformAuth({ open, mode, onClose, onModeChange }: { open: boolean; mode: AuthMode; onClose: () => void; onModeChange: (mode: AuthMode) => void }) {
  const utils = trpc.useUtils();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [resetRequested, setResetRequested] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const closeAfterAuth = async () => { await utils.auth.me.invalidate(); onClose(); };
  const login = trpc.auth.localLogin.useMutation({ onSuccess: closeAfterAuth, onError: (error) => setNotice(errorMessage(error)) });
  const signup = trpc.auth.localSignup.useMutation({ onSuccess: closeAfterAuth, onError: (error) => setNotice(errorMessage(error)) });
  const requestReset = trpc.auth.requestPasswordReset.useMutation({ onSuccess: (result) => { setResetRequested(true); setNotice(result.previewCode ? `کد بازیابی این محیط: ${result.previewCode}` : "اگر حساب وجود داشته باشد، کد بازیابی آماده می‌شود."); }, onError: (error) => setNotice(errorMessage(error)) });
  const resetPassword = trpc.auth.resetPassword.useMutation({ onSuccess: closeAfterAuth, onError: (error) => setNotice(errorMessage(error)) });
  const isBusy = login.isPending || signup.isPending || requestReset.isPending || resetPassword.isPending;
  const copy = resetRequested && mode === "forgot" ? { ...content.forgot, title: "رمز تازه", description: "کد شش‌رقمی و رمز جدید را وارد کن.", action: "تغییر رمز و ورود" } : content[mode];

  useEffect(() => {
    if (!open) { setNotice(null); setResetRequested(false); setResetCode(""); }
  }, [open]);
  useEffect(() => { setNotice(null); setResetRequested(false); setResetCode(""); }, [mode]);

  if (!open) return null;
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setNotice(null);
    if (mode === "forgot") {
      if (!resetRequested) { requestReset.mutate({ username }); return; }
      resetPassword.mutate({ code: resetCode, password });
      return;
    }
    const mutation = mode === "login" ? login : signup;
    mutation.mutate({ username, password });
  };

  return (
    <div className="overlay-backdrop auth-backdrop" role="presentation" onMouseDown={onClose}>
      <section className={`auth-modal glass-panel auth-mode-${mode}`} role="dialog" aria-modal="true" aria-label="ورود و ثبت‌نام" onMouseDown={(event) => event.stopPropagation()}>
        <span className="auth-liquid-orb auth-orb-one" aria-hidden="true" />
        <span className="auth-liquid-orb auth-orb-two" aria-hidden="true" />
        <span className="auth-specular" aria-hidden="true" />
        <button className="overlay-close" type="button" onClick={onClose} aria-label="بستن"><X size={19} /></button>
        <div className="auth-mark"><LockKeyhole size={21} /></div>
        <span className="auth-eyebrow">{copy.eyebrow}</span>
        <h2>{copy.title}</h2>
        <p>{copy.description}</p>
        <form onSubmit={submit} className="auth-form">
          <label htmlFor="nexus-username">
            <span>نام کاربری</span>
            <div>
              <UserRound size={17} />
              <input id="nexus-username" name="username" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" placeholder="مثلاً nima" disabled={isBusy || resetRequested} />
            </div>
          </label>
          {resetRequested && mode === "forgot" && (
            <label htmlFor="nexus-reset-code">
              <span>کد بازیابی</span>
              <div>
                <KeyRound size={17} />
                <input id="nexus-reset-code" name="code" value={resetCode} onChange={(event) => setResetCode(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="۶ رقم" disabled={isBusy} />
              </div>
            </label>
          )}
          {(mode !== "forgot" || resetRequested) && (
            <label htmlFor="nexus-password">
              <span>{resetRequested ? "رمز جدید" : "رمز عبور"}</span>
              <div>
                <KeyRound size={17} />
                <input id="nexus-password" name="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={resetRequested ? "new-password" : mode === "signup" ? "new-password" : "current-password"} type={showPassword ? "text" : "password"} placeholder="حداقل ۸ کاراکتر" disabled={isBusy} />
                <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label="نمایش رمز">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>
            </label>
          )}
          <button className="auth-submit" type="submit" disabled={isBusy}>
            {isBusy ? <><LoaderCircle className="animate-spin" size={17} />در حال بررسی…</> : <>{copy.action}<ArrowLeft size={17} /></>}
          </button>
        </form>
        {notice && <div className="auth-notice"><CircleHelp size={15} /><span>{notice}</span></div>}
        <div className="auth-switch">
          {mode === "login" ? (
            <>
              <span>حساب نداری؟</span>
              <button type="button" onClick={() => onModeChange("signup")}>ثبت‌نام</button>
              <button type="button" onClick={() => onModeChange("forgot")}>فراموشی رمز</button>
            </>
          ) : (
            <>
              <span>حساب داری؟</span>
              <button type="button" onClick={() => onModeChange("login")}>ورود</button>
            </>
          )}
        </div>
        <small className="auth-preview-note">فقط ورود با نام کاربری و رمز. نام کاربری باید انگلیسی باشد.</small>
      </section>
    </div>
  );
}
