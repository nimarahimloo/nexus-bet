import { ArrowLeft, BadgePercent, CircleHelp, Crown, Gift, Layers3, LockKeyhole, Medal, ShieldCheck, Sparkles, Trophy, WalletCards, Zap } from "lucide-react";
import { Link } from "wouter";
import { PageShell } from "@/components/PageShell";
import { formatFaNumber } from "@shared/format";

const featureCards = [
  { title: "بونوس‌های فعال", detail: "پیشنهادها را با شرایط گردش، مهلت و وضعیت روشن مقایسه کن.", icon: BadgePercent, href: "/promotions" },
  { title: "تورنمنت‌ها", detail: "جدول رقابت، قوانین امتیازگیری و جوایز هر رویداد را ببین.", icon: Trophy, href: "/tournaments" },
  { title: "گردونهٔ روزانه", detail: "شانس روزانه‌ات را بررسی کن؛ شرایط دریافت قبل از چرخش نمایش داده می‌شود.", icon: Gift, href: "/rewards" },
  { title: "کازینو و بازی‌ها", detail: "بازی‌های کرش، رومیزی و سرگرمی‌های سریع در یک مرکز مجزا.", icon: Layers3, href: "/casino" },
];

export function PromotionsPage() {
  const offers = [
    ["شروع امن", "اولین مسیر حساب", "نیازمند احراز حساب و مطالعهٔ قوانین", "ورزش"],
    ["کش‌بک فعالیت", "بازگشت بر اساس شرایط", "درصد و سقف از داخل قوانین هر کمپین", "عمومی"],
    ["ضریب ویژه", "بازارهای منتخب", "فقط برای رویدادها و زمان‌های مشخص", "ورزش"],
  ];
  return <PageShell eyebrow="پیشنهادها" title="پیشنهادها را قبل از فعال‌سازی بفهم" description="کمپین‌ها باید قابل‌فهم، قابل‌پیگیری و همراه با شرایط کامل باشند؛ این بخش ساختار مرکز پیشنهادهای Nexus Bet را نشان می‌دهد." heroImage="/manus-storage/nexus-bet-ai-hero-v2_ad9c88ae.png"><div className="feature-intro glass-panel"><div className="feature-intro-icon"><BadgePercent size={23} /></div><div><b>شرایط مهم، بالای صفحه</b><p>مهلت، حداقل گردش و محدودیت هر پیشنهاد پیش از دکمهٔ فعال‌سازی دیده می‌شود.</p></div><span className="sample-chip">مرکز پیشنهادها</span></div><div className="offer-grid">{offers.map(([title, value, note, category]) => <article className="offer-card glass-panel" key={title}><div className="offer-card-top"><span className="sample-chip">{category}</span><BadgePercent size={18} /></div><h3>{title}</h3><strong>{value}</strong><p>{note}</p><button className="solid-cta">مشاهدهٔ قوانین <ArrowLeft size={15} /></button></article>)}</div><div className="responsible-inline"><ShieldCheck size={17} /><span>هیچ پیشنهاد یا ضریبی نتیجه را تضمین نمی‌کند. مبلغ و شرایط را پیش از ادامه بررسی کن.</span></div></PageShell>;
}

export function TournamentsPage() {
  return <PageShell eyebrow="رقابت‌ها" title="در جدول رقابت، مسیرت را ببین" description="تورنمنت‌ها فقط یک بنر نیستند؛ رتبه، مدل امتیازگیری، زمان پایان و قوانین باید کنار هم دیده شوند." heroImage="/manus-storage/nexus-bet-matches-hero-v2_fbfab850.png"><div className="tournament-feature glass-panel"><div><span className="sample-chip live-chip">در حال برگزاری</span><h2>جام انتخاب‌های دقیق</h2><p>امتیاز بر اساس بلیت‌های معتبر و قوانین همان رویداد محاسبه می‌شود.</p></div><div className="tournament-score"><strong>{formatFaNumber(7)}</strong><span>روز تا پایان</span></div></div><div className="standings-grid"><article className="standings-card glass-panel"><div className="panel-title"><div><span className="section-kicker">جدول زنده</span><h3>رتبه‌بندی تو</h3></div><Medal size={21} /></div>{["ورود به جدول", "قوانین امتیاز", "تاریخچهٔ رتبه"].map((item, index) => <div className="standing-row" key={item}><span>{formatFaNumber(index + 1, { maximumFractionDigits: 0 })}</span><b>{item}</b><small>{index === 0 ? "در انتظار فعالیت" : "قابل مشاهده"}</small></div>)}</article><article className="standings-card glass-panel"><div className="panel-title"><div><span className="section-kicker">مسیر پیشرفت</span><h3>امتیاز فعالیت</h3></div><Sparkles size={21} /></div><div className="progress-track"><span style={{ width: "58%" }} /></div><p className="muted-copy">هر رویداد قوانین امتیازدهی خودش را دارد. شرایط کامل قبل از ورود به رقابت نمایش داده می‌شود.</p><Link href="/vip" className="outline-cta">مشاهدهٔ باشگاه VIP <ArrowLeft size={15} /></Link></article></div></PageShell>;
}

export function RewardsPage() {
  return <PageShell eyebrow="پاداش‌ها" title="هر روز یک مسیر تازه برای تعامل" description="گردونه و پاداش‌ها در یک فضای شفاف؛ جایزه، احتمال و محدودیت‌ها پیش از اقدام نمایش داده می‌شوند." heroImage="/manus-storage/nexus-bet-ai-hero-v2_ad9c88ae.png"><div className="reward-wheel-card glass-panel"><div className="wheel-visual"><div className="wheel-core"><Gift size={28} /><span>امروز</span></div></div><div className="wheel-copy"><span className="sample-chip">گردونهٔ کلاسیک</span><h2>چرخش روزانه آماده است</h2><p>پیش از چرخش، قوانین، محدودیت حساب و نحوهٔ مصرف پاداش را مرور کن.</p><div className="wheel-actions"><button className="primary-cta">مشاهدهٔ قوانین <ArrowLeft size={15} /></button><Link href="/vip" className="text-link">گردونهٔ VIP <Crown size={15} /></Link></div></div></div><div className="reward-rules glass-panel"><CircleHelp size={19} /><div><b>پاداش قابل‌پیگیری</b><p>پاداش‌ها به‌صورت نمایشی تا زمان اتصال ledger واقعی نشان داده می‌شوند؛ هیچ موجودی ساختگی به کیف پول اضافه نمی‌شود.</p></div><LockKeyhole size={18} /></div></PageShell>;
}

export function CasinoPage() {
  const games = [["Crash Arena", "کرش", Zap], ["Table Room", "رومیزی", Layers3], ["Live Studio", "زنده", Sparkles], ["Tournament Slots", "اسلات", Trophy]] as const;
  return <PageShell eyebrow="مرکز بازی‌ها" title="بازی‌ها را بر اساس حال‌وهوایت پیدا کن" description="یک مرکز بازی مستقل برای جداکردن ورزش از سرگرمی، با دسته‌بندی کوتاه و مسیر سریع به Crash." heroImage="/manus-storage/nexus-bet-crash-hero-v2_ef7fde4d.png"><div className="casino-toolbar glass-panel"><div><span className="section-kicker">کتابخانهٔ بازی</span><h2>انتخاب سریع</h2></div><div className="casino-filters"><button className="selected">همه</button><button>کرش</button><button>رومیزی</button><button>زنده</button></div></div><div className="game-grid">{games.map(([title, category, Icon]) => <article className="game-card glass-panel" key={title}><div className="game-card-icon"><Icon size={21} /></div><span>{category}</span><h3>{title}</h3><p>صفحهٔ بازی و قوانین پیش از ورود نمایش داده می‌شود.</p><Link href={category === "کرش" ? "/crash" : "/account"} className="outline-cta">مشاهده <ArrowLeft size={15} /></Link></article>)}</div><div className="responsible-inline"><WalletCards size={17} /><span>برای بازی‌های مالی، سقف شخصی تعیین کن و فقط با موجودی قابل‌استفاده ادامه بده.</span></div></PageShell>;
}

export function FeatureHub() {
  return <section className="feature-hub container" aria-labelledby="feature-hub-title"><div className="section-heading"><div><span className="section-kicker">بیشتر از یک لیست مسابقه</span><h2 id="feature-hub-title">مرکز تجربهٔ Nexus Bet</h2></div><Link href="/promotions" className="text-link">دیدن همه <ArrowLeft size={15} /></Link></div><div className="feature-hub-grid">{featureCards.map(({ title, detail, icon: Icon, href }) => <Link className="feature-hub-card glass-panel" href={href} key={title}><span className="feature-hub-icon"><Icon size={19} /></span><div><h3>{title}</h3><p>{detail}</p></div><ArrowLeft className="feature-hub-arrow" size={17} /></Link>)}</div></section>;
}
