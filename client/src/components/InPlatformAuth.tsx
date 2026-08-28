import { useEffect, useState } from "react";
import { Apple, ArrowLeft, Chrome, CircleHelp, Eye, EyeOff, Facebook, KeyRound, LockKeyhole, MessageCircle, UserRound, X } from "lucide-react";
import { type AuthMode } from "@/lib/platformOverlay";

type Provider = "Google" | "Discord" | "Facebook" | "Apple";

const content: Record<AuthMode, { eyebrow: string; title: string; description: string; action: string }> = {
  login: { eyebrow: "NEXUS ACCESS", title: "به حساب خودت برگرد", description: "برای ادامهٔ مسیر، نام کاربری و رمز را وارد کن.", action: "ورود به Nexus Bet" },
  signup: { eyebrow: "START HERE", title: "حساب Nexus بساز", description: "در نسخهٔ preview، ثبت‌نام فقط داخل همین محیط بررسی می‌شود.", action: "ساخت حساب" },
  forgot: { eyebrow: "ACCOUNT RECOVERY", title: "رمزت را بازیابی کن", description: "نام کاربری یا ایمیل را وارد کن تا مسیر بازیابی را دریافت کنی.", action: "ارسال مسیر بازیابی" },
};

export function InPlatformAuth({ open, mode, onClose, onModeChange }: { open: boolean; mode: AuthMode; onClose: () => void; onModeChange: (mode: AuthMode) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const copy = content[mode];
  useEffect(() => { if (!open) setNotice(null); }, [open]);
  if (!open) return null;
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!username.trim() || (mode !== "forgot" && password.trim().length < 6)) { setNotice(mode === "forgot" ? "نام کاربری یا ایمیل را وارد کن." : "نام کاربری و رمز حداقل شش‌کاراکتری لازم است."); return; }
    setNotice(mode === "forgot" ? "در نسخهٔ preview، مسیر بازیابی در همین modal شبیه‌سازی شد و هیچ درخواست خارجی ارسال نشد." : "فرم با موفقیت بررسی شد. اتصال واقعی حساب پس از راه‌اندازی production فعال می‌شود.");
  };
  const selectProvider = (provider: Provider) => setNotice(`${provider} در نسخهٔ preview فقط به‌صورت دکمهٔ داخلی نمایش داده می‌شود و redirect ندارد.`);
  return <div className="overlay-backdrop auth-backdrop" role="presentation" onMouseDown={onClose}><section className="auth-modal glass-panel" role="dialog" aria-modal="true" aria-label="ورود و ثبت‌نام Nexus Bet" onMouseDown={(event) => event.stopPropagation()}><button className="overlay-close" onClick={onClose} aria-label="بستن"><X size={19} /></button><div className="auth-mark"><LockKeyhole size={21} /></div><span className="auth-eyebrow">{copy.eyebrow}</span><h2>{copy.title}</h2><p>{copy.description}</p><form onSubmit={submit} className="auth-form"><label><span>{mode === "forgot" ? "نام کاربری یا ایمیل" : "نام کاربری"}</span><div><UserRound size={17} /><input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" placeholder="مثلاً nexus.user" /></div></label>{mode !== "forgot" && <label><span>رمز عبور</span><div><KeyRound size={17} /><input value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" type={showPassword ? "text" : "password"} placeholder="حداقل ۶ کاراکتر" /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label="نمایش رمز">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label>}<button className="auth-submit" type="submit">{copy.action}<ArrowLeft size={17} /></button></form>{notice && <div className="auth-notice"><CircleHelp size={15} /><span>{notice}</span></div>}<div className="auth-divider"><span>یا ادامه بده با</span></div><div className="auth-providers"><button type="button" onClick={() => selectProvider("Google")} aria-label="ادامه با Google"><Chrome size={18} /><span>Google</span></button><button type="button" onClick={() => selectProvider("Discord")} aria-label="ادامه با Discord"><MessageCircle size={18} /><span>Discord</span></button><button type="button" onClick={() => selectProvider("Facebook")} aria-label="ادامه با Facebook"><Facebook size={18} /><span>Facebook</span></button><button type="button" onClick={() => selectProvider("Apple")} aria-label="ادامه با Apple"><Apple size={18} /><span>Apple</span></button></div><div className="auth-switch">{mode === "login" ? <><span>حساب نداری؟</span><button onClick={() => onModeChange("signup")}>ثبت‌نام</button><button onClick={() => onModeChange("forgot")}>فراموشی رمز</button></> : <><span>حساب داری؟</span><button onClick={() => onModeChange("login")}>ورود</button></>}</div><small className="auth-preview-note">نسخهٔ preview · اطلاعاتی به provider یا سرویس بیرونی ارسال نمی‌شود.</small></section></div>;
}
