import { BadgePercent, CircleCheck, CircleHelp, Gift, Layers3, LockKeyhole, ShieldCheck, Trophy, WalletCards, Zap } from "lucide-react";
import { Link } from "wouter";
import { PageShell } from "@/components/PageShell";
import { getDataSourceLabel } from "@shared/dataTruth";

function PreviewNotice({ label }: { label: string }) {
  return <div className="data-state preview-notice"><ShieldCheck size={15} /><span>{label} · {getDataSourceLabel("demo")}؛ تا اتصال backend و ledger واقعی، هیچ رکورد یا موجودی عملیاتی از این بخش ساخته نمی‌شود.</span></div>;
}

const featureCards = [
  { title: "بونوس‌های فعال", detail: "پیشنهادها را فقط با شرایط معتبر و قابل‌پیگیری ببین.", icon: BadgePercent, href: "/promotions" },
  { title: "تورنمنت‌ها", detail: "رقابت‌ها پس از اتصال جدول امتیاز و قوانین رسمی نمایش داده می‌شوند.", icon: Trophy, href: "/tournaments" },
  { title: "گردونهٔ روزانه", detail: "پاداش فقط پس از فعال‌شدن ledger و قوانین دریافت قابل استفاده است.", icon: Gift, href: "/rewards" },
  { title: "کازینو و بازی‌ها", detail: "بازی‌های قابل‌ورود باید از catalog واقعی سرویس خوانده شوند.", icon: Layers3, href: "/casino" },
];

function OperationalEmpty({ title, detail, href = "/matches", cta = "بازگشت به مسابقات" }: { title: string; detail: string; href?: string; cta?: string }) {
  return <div className="empty-state glass-panel operational-empty"><span className="empty-state-icon"><LockKeyhole size={21} /></span><h2>{title}</h2><p>{detail}</p><Link href={href} className="outline-cta">{cta} <Zap size={15} /></Link></div>;
}

export function PromotionsPage() {
  return <PageShell eyebrow="پیشنهادها" title="پیشنهاد معتبر، نه کارت تزئینی" description="کمپین فقط وقتی نمایش داده می‌شود که منبع، شرایط، مهلت و مسیر ثبت آن از backend قابل‌ردیابی باشد." heroImage="/manus-storage/nexus-bet-ai-hero-v2_ad9c88ae.png"><PreviewNotice label="بونوس‌ها" /><OperationalEmpty title="کمپین عملیاتی در دسترس نیست" detail="هیچ بونوس یا ضریب تبلیغاتی به‌عنوان فعال نمایش داده نمی‌شود تا سرویس کمپین و ledger واقعی متصل شوند." /><div className="responsible-inline"><ShieldCheck size={17} /><span>این صفحه عمداً از مبلغ، درصد، مهلت یا فعال‌سازی ساختگی استفاده نمی‌کند.</span></div></PageShell>;
}

export function TournamentsPage() {
  return <PageShell eyebrow="رقابت‌ها" title="رقابت را با جدول واقعی شروع کن" description="رتبه‌بندی، امتیاز، جایزه و قوانین باید از رویداد رسمی خوانده شوند؛ دادهٔ نمونه به‌جای وضعیت کاربر نمایش داده نمی‌شود." heroImage="/manus-storage/nexus-bet-matches-hero-v2_fbfab850.png"><PreviewNotice label="تورنمنت‌ها" /><OperationalEmpty title="تورنمنت فعال پیدا نشد" detail="تا اتصال سرویس رقابت و event ledger، هیچ رتبه، امتیاز، تعداد شرکت‌کننده یا جایزه‌ای حدس زده نمی‌شود." /><div className="rules-card glass-panel"><div><CircleCheck size={18} /><b>شرایط روشن</b><p>قوانین رسمی، زمان پایان و نحوهٔ امتیازدهی قبل از ثبت‌نام نمایش داده خواهند شد.</p></div><div><ShieldCheck size={18} /><b>بدون جایزهٔ ساختگی</b><p>موجودی یا پاداشی بدون ثبت در ledger به حساب کاربر اضافه نمی‌شود.</p></div></div></PageShell>;
}

export function RewardsPage() {
  return <PageShell eyebrow="پاداش‌ها" title="پاداشی که قابل‌پیگیری باشد" description="گردونه و پاداش زمانی فعال می‌شوند که احتمال، محدودیت، نتیجه و ثبت ledger آن‌ها از منبع واقعی بیاید." heroImage="/manus-storage/nexus-bet-ai-hero-v2_ad9c88ae.png"><PreviewNotice label="پاداش روزانه" /><div className="reward-wheel-card glass-panel"><div className="wheel-visual"><div className="wheel-core"><Gift size={28} /><span>در انتظار اتصال</span></div></div><div className="wheel-copy"><span className="sample-chip">غیرفعال</span><h2>گردونه هنوز عملیاتی نیست</h2><p>برای جلوگیری از نمایش شانس یا جایزهٔ جعلی، این مسیر تا اتصال سرویس پاداش قفل است.</p><div className="wheel-actions"><button className="primary-cta" disabled>در انتظار backend <LockKeyhole size={15} /></button><Link href="/vip" className="text-link">وضعیت VIP <Trophy size={15} /></Link></div></div></div><div className="reward-rules glass-panel"><CircleHelp size={19} /><div><b>منبع حقیقت پاداش</b><p>نتیجهٔ چرخش، محدودیت حساب و هر تغییر موجودی باید قابل‌ردیابی و قابل‌بررسی باشد.</p></div><LockKeyhole size={18} /></div></PageShell>;
}

export function CasinoPage() {
  return <PageShell eyebrow="مرکز بازی‌ها" title="کتابخانهٔ بازی از catalog واقعی" description="مرکز بازی فقط بازی‌هایی را نشان می‌دهد که سرویس catalog آن‌ها را فعال و قابل‌ورود اعلام کرده باشد." heroImage="/manus-storage/nexus-bet-crash-hero-v2_ef7fde4d.png"><PreviewNotice label="مرکز بازی‌ها" /><div className="game-grid"><article className="game-card glass-panel"><div className="game-card-icon"><Zap size={21} /></div><span>کرش</span><h3>Crash Arena</h3><p>بازی انفجار مستقل Nexus Bet با وضعیت و تاریخچهٔ محلی قابل مشاهده است.</p><Link href="/crash" className="outline-cta">ورود به Crash <Zap size={15} /></Link></article></div><div className="responsible-inline"><WalletCards size={17} /><span>سایر بازی‌ها تا دریافت catalog و قوانین رسمی عمداً در این صفحه فهرست نمی‌شوند.</span></div></PageShell>;
}

export function FeatureHub() {
  return <section className="feature-hub container" aria-labelledby="feature-hub-title"><div className="section-heading"><div><span className="section-kicker">بیشتر از یک لیست مسابقه</span><h2 id="feature-hub-title">مرکز تجربهٔ Nexus Bet</h2></div><Link href="/promotions" className="text-link">دیدن همه <Zap size={15} /></Link></div><div className="feature-hub-grid">{featureCards.map(({ title, detail, icon: Icon, href }) => <Link className="feature-hub-card glass-panel" href={href} key={title}><span className="feature-hub-icon"><Icon size={19} /></span><div><h3>{title}</h3><p>{detail}</p></div><Zap className="feature-hub-arrow" size={17} /></Link>)}</div></section>;
}
