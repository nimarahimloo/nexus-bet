import { Link, useLocation } from "wouter";
import { ArrowRight, Bell, CircleDollarSign, Gamepad2, Home, Menu, ReceiptText, Sparkles, Trophy, UserRound, WalletCards, X } from "lucide-react";
import { useState, type ReactNode } from "react";

/** PageShell is a visual wrapper; numeric values belong to route-level display helpers. */
export const pageShellDisplayContract = { numericFields: [] as const } as const;

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
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const isActive = (href: string) => href === "/" ? location === "/" : location.startsWith(href);
  return <main className={`nexus-shell ${isHome ? "home-shell" : "subpage-shell"}`}>
    <header className="topbar glass-panel">
      <Link href="/" className="brand" onClick={() => setOpen(false)}><span className="brand-mark"><img src="/manus-storage/nexus-bet-logo_92fe8c09.png" alt="" /></span><span><b>NEXUS</b><small>BET</small></span></Link>
      <nav className={`main-nav ${open ? "is-open" : ""}`} aria-label="ناوبری اصلی">
        {primaryNav.map(([href, label]) => <Link key={href} href={href} className={`nav-link ${isActive(href) ? "is-active" : ""}`} onClick={() => setOpen(false)}>{label}{href === "/matches" && <i className="live-dot" />}</Link>)}
        <span className="nav-divider" aria-hidden="true" />
        <div className="more-nav-grid" aria-label="بخش‌های بیشتر">{moreNav.map(([href, label, Icon]) => <Link key={href} href={href} className={`nav-link nav-link-more ${isActive(href) ? "is-active" : ""}`} onClick={() => setOpen(false)}><Icon size={13} />{label}</Link>)}</div>
      </nav>
      <div className="header-actions"><button className="icon-button" aria-label="اعلان‌ها"><Bell size={17} /></button><Link href="/account" className="login-button" onClick={() => setOpen(false)}><UserRound size={16} /> ورود امن</Link><button className="icon-button mobile-menu" onClick={() => setOpen(!open)} aria-label={open ? "بستن منو" : "بازکردن منو"}>{open ? <X size={19} /> : <Menu size={19} />}</button></div>
    </header>
    {!isHome && title && <section className="subpage-hero container"><div className="subpage-copy"><Link href="/" className="back-link"><ArrowRight size={15} /> برگشت به خانه</Link><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div><div className="subpage-art glass-panel"><img src={heroImage} alt="" /><div className="art-overlay" /></div></section>}
    <section className={`${isHome ? "" : "subpage-content"} container`}>{children}</section>
    <nav className="mobile-bottom-nav" aria-label="ناوبری موبایل"><Link href="/" className={isActive("/") ? "is-active" : ""}><Home size={17} /><span>خانه</span></Link><Link href="/matches" className={isActive("/matches") ? "is-active" : ""}><Trophy size={17} /><span>مسابقات</span></Link><Link href="/crash" className={isActive("/crash") ? "is-active" : ""}><ReceiptText size={17} /><span>انفجار</span></Link><Link href="/wallet" className={isActive("/wallet") ? "is-active" : ""}><WalletCards size={17} /><span>کیف پول</span></Link><Link href="/account" className={isActive("/account") ? "is-active" : ""}><UserRound size={17} /><span>حساب</span></Link></nav>
  </main>;
}
