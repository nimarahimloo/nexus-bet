import { Link, useLocation } from "wouter";
import { ArrowRight, Bell, CircleDollarSign, Gamepad2, Headphones, Home, Menu, ReceiptText, Sparkles, Trophy, UserRound, WalletCards, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { InPlatformAuth } from "@/components/InPlatformAuth";
import { InPlatformSupport } from "@/components/InPlatformSupport";
import { type AuthMode } from "@/lib/platformOverlay";
export { pageShellDisplayContract } from "@/lib/pageShellContract";

const primaryNav = [
  ["/", "خانه"],
  ["/matches", "مسابقات"],
  ["/crash", "انفجار"],
  ["/wallet", "کیف پول"],
  ["/account", "حساب من"],
] as const;

const moreNav = [
  ["/ai", "Nexus AI", Sparkles],
  ["/vip", "باشگاه VIP", Trophy],
  ["/promotions", "پیشنهادها", CircleDollarSign],
  ["/tournaments", "تورنمنت‌ها", Trophy],
  ["/rewards", "پاداش‌ها", Sparkles],
  ["/casino", "مرکز بازی‌ها", Gamepad2],
] as const;

export function PageShell({ title, eyebrow, description, heroImage, children, isHome = false }: { title?: string; eyebrow?: string; description?: string; heroImage?: string; children: ReactNode; isHome?: boolean }) {
  const previewAuthMode = typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("auth");
  const [open, setOpen] = useState(() => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("menu") === "preview");
  const [authOpen, setAuthOpen] = useState(() => previewAuthMode === "login" || previewAuthMode === "signup" || previewAuthMode === "forgot");
  const [authMode, setAuthMode] = useState<AuthMode>(() => previewAuthMode === "signup" || previewAuthMode === "forgot" ? previewAuthMode : "login");
  const [supportOpen, setSupportOpen] = useState(() => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("support") === "preview");
  const [location] = useLocation();
  useEffect(() => {
    const onAuthOpen = (event: Event) => { const mode = (event as CustomEvent<{ mode?: AuthMode }>).detail?.mode; setAuthMode(mode ?? "login"); setAuthOpen(true); };
    const onSupportOpen = () => setSupportOpen(true);
    window.addEventListener("nexus:auth-open", onAuthOpen);
    window.addEventListener("nexus:support-open", onSupportOpen);
    return () => { window.removeEventListener("nexus:auth-open", onAuthOpen); window.removeEventListener("nexus:support-open", onSupportOpen); };
  }, []);
  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);
  const isActive = (href: string) => href === "/" ? location === "/" : location.startsWith(href);
  return <main className={`nexus-shell ${isHome ? "home-shell" : "subpage-shell"}`}>
    <header className="topbar glass-panel">
      <Link href="/" className="brand" onClick={() => setOpen(false)}><span className="brand-mark"><img src="/manus-storage/nexus-bet-logo_92fe8c09.png" alt="" /></span><span><b>NEXUS</b><small>BET</small></span></Link>
      <nav id="mobile-primary-navigation" className={`main-nav ${open ? "is-open" : ""}`} aria-label="ناوبری اصلی">
        {primaryNav.map(([href, label]) => <Link key={href} href={href} className={`nav-link ${isActive(href) ? "is-active" : ""}`} onClick={() => setOpen(false)}>{label}{href === "/matches" && <i className="live-dot" />}</Link>)}
        <span className="nav-divider" aria-hidden="true" />
        <div className="more-nav-grid" aria-label="بخش‌های بیشتر">{moreNav.map(([href, label, Icon]) => <Link key={href} href={href} className={`nav-link nav-link-more ${isActive(href) ? "is-active" : ""}`} onClick={() => setOpen(false)}><Icon size={13} />{label}</Link>)}</div>
      </nav>
      <div className="header-actions"><button className="icon-button" aria-label="اعلان‌ها"><Bell size={17} /></button><button className="login-button" onClick={() => { setOpen(false); setAuthMode("login"); setAuthOpen(true); }}><UserRound size={16} /> ورود امن</button><button className="icon-button mobile-menu" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls="mobile-primary-navigation" aria-label={open ? "بستن منو" : "بازکردن منو"}>{open ? <X size={19} /> : <Menu size={19} />}</button></div>
    </header>
    {open && <button className="mobile-nav-backdrop" type="button" tabIndex={-1} aria-label="بستن منو" onClick={() => setOpen(false)} />}
    {!isHome && title && <section className="subpage-hero container"><div className="subpage-copy"><Link href="/" className="back-link"><ArrowRight size={15} /> برگشت به خانه</Link><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div><div className="subpage-art glass-panel"><img src={heroImage} alt="" /><div className="art-overlay" /></div></section>}
    <section className={`${isHome ? "" : "subpage-content"} container`}>{children}</section>
    <nav className="mobile-bottom-nav" aria-label="ناوبری موبایل"><Link href="/" className={isActive("/") ? "is-active" : ""}><Home size={17} /><span>خانه</span></Link><Link href="/matches" className={isActive("/matches") ? "is-active" : ""}><Trophy size={17} /><span>مسابقات</span></Link><Link href="/crash" className={isActive("/crash") ? "is-active" : ""}><ReceiptText size={17} /><span>انفجار</span></Link><Link href="/wallet" className={isActive("/wallet") ? "is-active" : ""}><WalletCards size={17} /><span>کیف پول</span></Link><Link href="/account" className={isActive("/account") ? "is-active" : ""}><UserRound size={17} /><span>حساب</span></Link></nav>
    <button className="support-launcher" onClick={() => setSupportOpen(true)} aria-label="بازکردن پشتیبانی هوشمند"><Headphones size={20} /><span>پشتیبانی</span></button>
    <InPlatformAuth open={authOpen} mode={authMode} onClose={() => setAuthOpen(false)} onModeChange={setAuthMode} />
    <InPlatformSupport open={supportOpen} onClose={() => setSupportOpen(false)} />
  </main>;
}
