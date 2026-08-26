import { Link } from "wouter";
import { ArrowRight, Bell, Home, Menu, ReceiptText, UserRound, WalletCards, X } from "lucide-react";
import { useState, type ReactNode } from "react";

/** PageShell is a visual wrapper; numeric values belong to route-level display helpers. */
export const pageShellDisplayContract = { numericFields: [] as const } as const;

export function PageShell({ title, eyebrow, description, heroImage, children }: { title: string; eyebrow: string; description: string; heroImage: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <main className="nexus-shell subpage-shell">
    <header className="topbar glass-panel"><Link href="/" className="brand"><span className="brand-mark">N</span><span><b>NEXUS</b><small>BET</small></span></Link><nav className={`main-nav ${open ? "is-open" : ""}`}><Link href="/" className="nav-link">مسابقات</Link><Link href="/crash" className="nav-link">انفجار</Link><Link href="/wallet" className="nav-link">کیف پول</Link><Link href="/account" className="nav-link">حساب من</Link></nav><div className="header-actions"><button className="icon-button"><Bell size={17} /></button><Link href="/account" className="login-button"><UserRound size={16} /> ورود امن</Link><button className="icon-button mobile-menu" onClick={() => setOpen(!open)}>{open ? <X size={19} /> : <Menu size={19} />}</button></div></header>
    <section className="subpage-hero container"><div className="subpage-copy"><Link href="/" className="back-link"><ArrowRight size={15} /> برگشت به مسابقات</Link><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div><div className="subpage-art glass-panel"><img src={heroImage} alt="" /><div className="art-overlay" /></div></section>
    <section className="subpage-content container">{children}</section>
    <nav className="mobile-bottom-nav"><Link href="/"><Home size={17} /><span>خانه</span></Link><Link href="/crash"><ReceiptText size={17} /><span>انفجار</span></Link><Link href="/wallet"><WalletCards size={17} /><span>کیف پول</span></Link><Link href="/account"><UserRound size={17} /><span>حساب</span></Link></nav>
  </main>;
}
