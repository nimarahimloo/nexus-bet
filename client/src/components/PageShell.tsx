import { Link, useLocation } from "wouter";
import { Activity, ArrowRight, Bell, CircleDollarSign, Gamepad2, Headphones, Home, LayoutDashboard, Menu, ReceiptText, ShieldCheck, Sparkles, Trophy, UserRound, WalletCards, X } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";
import { InPlatformAuth } from "@/components/InPlatformAuth";
import { InPlatformSupport } from "@/components/InPlatformSupport";
import { NotificationsPopover } from "@/components/NotificationsPopover";
import { trpc } from "@/lib/trpc";
import { type AuthMode } from "@/lib/platformOverlay";
import { useAuth } from "@/_core/hooks/useAuth";
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
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsCount = trpc.notifications.unreadCount.useQuery(undefined, { staleTime: 15_000 }).data ?? 0;
  const [location] = useLocation();
  const { user } = useAuth();
  const reduceMotion = useReducedMotion();
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
  const routeSlug = location === "/" ? "home" : location.slice(1).split("/")[0] || "home";
  const contextualPrompt = routeSlug === "matches" ? "مسابقات زنده و فیلترهای این صفحه را توضیح بده" : routeSlug === "wallet" ? "موجودی و وضعیت تراکنش‌های کیف پولم را توضیح بده" : routeSlug === "rewards" ? "احتمال جوایز و پاداش فعالیت امروز را توضیح بده" : routeSlug === "crash" ? "قوانین round و وضعیت bet انفجار را توضیح بده" : routeSlug === "account" ? "وضعیت آخرین شرط‌های من را خلاصه کن" : "امکانات Nexus Bet را برایم توضیح بده";
  const openContextSupport = () => {
    window.dispatchEvent(new CustomEvent("nexus:ai-context", { detail: { prompt: contextualPrompt } }));
    window.dispatchEvent(new Event("nexus:support-open"));
  };
  return <motion.main className={`nexus-shell ${isHome ? "home-shell" : "subpage-shell"} route-${routeSlug}`} initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: reduceMotion ? 0 : .22 }}>
    <motion.header className="topbar glass-panel" initial={reduceMotion ? false : { opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : .42, ease: [0.16, 1, 0.3, 1] }}>
      <Link href="/" className="brand" onClick={() => setOpen(false)}><span className="brand-mark"><img src="/manus-storage/nexus-bet-logo_92fe8c09.png" alt="" /></span><span><b>NEXUS</b><small>BET</small></span></Link>
      <nav id="mobile-primary-navigation" className="main-nav" aria-label="ناوبری اصلی">
        {primaryNav.map(([href, label]) => <Link key={href} href={href} className={`nav-link ${isActive(href) ? "is-active" : ""}`} onClick={() => setOpen(false)}>{label}{href === "/matches" && <i className="live-dot" />}</Link>)}
      </nav>
      {open && <div id="more-navigation-drawer" className="more-nav-drawer glass-panel" role="dialog" aria-label="بخش‌های بیشتر"><div className="more-nav-drawer-head"><b>بخش‌های بیشتر</b><button type="button" onClick={() => setOpen(false)} aria-label="بستن بخش‌های بیشتر"><X size={17} /></button></div><div className="more-nav-grid">{[...moreNav, ...(user?.role === "admin" ? [["/admin", "مدیریت", LayoutDashboard] as const] : [])].map(([href, label, Icon]) => <Link key={href} href={href} className={`nav-link nav-link-more ${isActive(href) ? "is-active" : ""}`} onClick={() => setOpen(false)}><Icon size={14} />{label}</Link>)}</div></div>}
      <div className="header-actions"><button className={`icon-button notification-trigger ${notificationsOpen ? "is-active" : ""}`} aria-label="اعلان‌ها" aria-expanded={notificationsOpen} aria-controls="notifications-title" onClick={() => setNotificationsOpen((value) => !value)}><Bell size={17} />{notificationsCount > 0 && <span className="notification-badge">{notificationsCount > 99 ? "۹۹+" : notificationsCount}</span>}</button><button className="login-button" onClick={() => { setOpen(false); setAuthMode("login"); setAuthOpen(true); }}><UserRound size={16} /> ورود امن</button><button className="icon-button mobile-menu" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls="more-navigation-drawer" aria-label={open ? "بستن منو" : "بازکردن منو"}>{open ? <X size={19} /> : <Menu size={19} />}</button></div>
    </motion.header>
    {open && <button className="mobile-nav-backdrop" type="button" tabIndex={-1} aria-label="بستن منو" onClick={() => setOpen(false)} />}
    {!isHome && title && <motion.section className="subpage-hero container" initial={reduceMotion ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : .5, delay: .05, ease: [0.16, 1, 0.3, 1] }}><div className="subpage-copy"><Link href="/" className="back-link"><ArrowRight size={15} /> برگشت به خانه</Link><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div><div className="subpage-art glass-panel"><img src={heroImage} alt="" /><div className="art-overlay" /></div></motion.section>}
    {!isHome && <section className="trust-bar container" aria-label="شفافیت و اعتماد"><span><ShieldCheck size={15} /> بازی مسئولانه</span><span><CircleDollarSign size={15} /> کیف پول چندارزی · USDT پایه</span><span><Activity size={15} /> منبع داده مشخص</span></section>}
    {routeSlug !== "ai" && <button className="context-ai-strip" type="button" onClick={openContextSupport}><span><Sparkles size={15} /> AI سریع</span><b>پرسش از AI <ArrowRight size={14} /></b></button>}
    <motion.section key={location} className={`${isHome ? "" : "subpage-content"} container`} initial={reduceMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : .46, delay: isHome ? .05 : .13, ease: [0.16, 1, 0.3, 1] }}>{children}</motion.section>
    <nav className="mobile-bottom-nav" aria-label="ناوبری موبایل"><Link href="/" className={isActive("/") ? "is-active" : ""}><Home size={17} /><span>خانه</span></Link><Link href="/matches" className={isActive("/matches") ? "is-active" : ""}><Trophy size={17} /><span>مسابقات</span></Link><Link href="/crash" className={isActive("/crash") ? "is-active" : ""}><ReceiptText size={17} /><span>انفجار</span></Link><Link href="/wallet" className={isActive("/wallet") ? "is-active" : ""}><WalletCards size={17} /><span>کیف پول</span></Link><Link href="/account" className={isActive("/account") ? "is-active" : ""}><UserRound size={17} /><span>حساب</span></Link></nav>
    <button type="button" className="support-launcher" onClick={() => setSupportOpen(true)} aria-label="بازکردن پشتیبانی هوشمند" aria-haspopup="dialog" aria-expanded={supportOpen} aria-controls="nexus-support-dialog"><span className="support-status-dot" aria-hidden="true" /><Headphones size={20} /><span>پشتیبانی هوشمند</span></button>
    <InPlatformAuth open={authOpen} mode={authMode} onClose={() => setAuthOpen(false)} onModeChange={setAuthMode} />
    <InPlatformSupport open={supportOpen} onClose={() => setSupportOpen(false)} />
    <NotificationsPopover open={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
  </motion.main>;
}
