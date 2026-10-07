import { CheckCircle2, ExternalLink, FileCheck2, LockKeyhole, ShieldCheck, TriangleAlert } from "lucide-react";
import { Link } from "wouter";
import { PageShell } from "@/components/PageShell";
import { trpc } from "@/lib/trpc";

const policyCards = [
  { title: "Fairness و Crash proof", detail: "roundهای settled با commit/reveal و SHA-256 قابل بررسی‌اند.", href: "/crash", icon: FileCheck2 },
  { title: "دادهٔ واقعی", detail: "فقط فید و catalog فعال backend نمایش داده می‌شود؛ fallback با برچسب مشخص است.", href: "/matches", icon: CheckCircle2 },
  { title: "مسئولیت‌پذیری", detail: "پروفایل ریسک، Smart Stake و مسیر تاریخچه برای تصمیم‌گیری کنترل‌شده وجود دارد.", href: "/account", icon: ShieldCheck },
];

export function TrustCenterPage() {
  const providerQuery = trpc.wallet.providerStatus.useQuery(undefined, { staleTime: 30_000 });
  const provider = providerQuery.data;
  const ready = Boolean(provider?.enabled);

  return <PageShell eyebrow="اعتماد و شفافیت" title="Nexus Bet را قابل بررسی نگه می‌داریم" description="این صفحه وضعیت واقعی سیستم‌ها، proofهای قابل مشاهده و محدودیت‌های عملیاتی را نشان می‌دهد؛ هیچ مجوز، موجودی یا پرداختی اینجا ساخته نمی‌شود." heroImage="/brand/nexus-bet-wallet-hero-v2_884a12f2.png">
    <section className="trust-status-grid" aria-label="وضعیت اعتماد">
      <article className="trust-status-card glass-panel"><span className={ready ? "trust-status-icon is-ready" : "trust-status-icon is-blocked"}>{ready ? <CheckCircle2 size={21} /> : <LockKeyhole size={21} />}</span><div><span>پرداخت provider</span><strong>{providerQuery.isLoading ? "در حال بررسی" : ready ? "آمادهٔ sandbox" : "disabled-safe"}</strong><p>{ready ? "آمادگی provider از backend گزارش شده است." : "تا زمان credentials و sandbox smoke هیچ deposit/withdrawal واقعی فعال نیست."}</p></div></article>
      <article className="trust-status-card glass-panel"><span className="trust-status-icon is-ready"><ShieldCheck size={21} /></span><div><span>منبع داده</span><strong>backend-first</strong><p>فید مسابقات و catalog بازی فقط از وضعیت backend عبور می‌کند.</p></div></article>
      <article className="trust-status-card glass-panel"><span className="trust-status-icon is-ready"><FileCheck2 size={21} /></span><div><span>اثبات Crash</span><strong>SHA-256 commit/reveal</strong><p>برای roundهای settled، seed و hash عمومی در history قابل مشاهده است.</p></div></article>
    </section>

    <section className="trust-policy-grid" aria-label="مسیرهای شفافیت"><div className="section-heading"><div><span className="section-kicker">CONTROLLED ACCESS</span><h2>چه چیزی امروز قابل بررسی است؟</h2></div><span className="sample-chip">بدون ادعای اضافه</span></div><div className="trust-policy-cards">{policyCards.map(({ title, detail, href, icon: Icon }) => <Link className="trust-policy-card glass-panel" href={href} key={title}><span className="trust-policy-icon"><Icon size={19} /></span><div><h3>{title}</h3><p>{detail}</p></div><ExternalLink size={16} /></Link>)}</div></section>

    <section className="trust-boundaries glass-panel"><div className="trust-boundaries-head"><TriangleAlert size={20} /><div><span className="section-kicker">HONEST LIMITS</span><h2>مواردی که هنوز فعال اعلام نمی‌شوند</h2></div></div><p>متن حقوقی رسمی، KYC/AML، responsible gambling و dispute resolution باید با اطلاعات مالک/مجوز واقعی پروژه تکمیل و نسخه‌گذاری شوند. تا قبل از آن، Nexus Bet آن‌ها را به‌عنوان سند نهایی یا مجوز عملیاتی نمایش نمی‌دهد.</p><div className="trust-boundary-list"><span>بدون پرداخت واقعی</span><span>بدون provider ساختگی</span><span>بدون برد یا موجودی نمونه</span><span>بدون تضمین سود</span></div></section>
  </PageShell>;
}
