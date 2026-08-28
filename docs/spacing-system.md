# Nexus Bet spacing system

این پروژه از یک مقیاس spacing مشترک استفاده می‌کند تا فاصله‌گذاری در routeها، کارت‌ها، فرم‌ها و کنترل‌ها قابل پیش‌بینی بماند. برای featureهای جدید، به‌جای عدد خام از tokenهای `--space-*` یا tokenهای semantic استفاده کنید.

## مقیاس پایه

| Token | مقدار | کاربرد پیشنهادی |
| --- | ---: | --- |
| `--space-0` | `0px` | فقط برای reset آگاهانه |
| `--space-1` | `4px` | فاصلهٔ بسیار کوچک بین icon و label |
| `--space-2` | `8px` | فاصلهٔ کنترل‌ها و inline elements |
| `--space-3` | `12px` | فاصلهٔ compact و padding کنترل |
| `--space-4` | `16px` | فاصلهٔ استاندارد داخلی |
| `--space-5` | `20px` | فاصلهٔ بین گروه‌های کوچک |
| `--space-6` | `24px` | padding کارت و فاصلهٔ متوسط |
| `--space-7` | `28px` | فاصلهٔ بخش‌های موبایل |
| `--space-8` | `32px` | فاصلهٔ بخش یا hero متوسط |
| `--space-9` تا `--space-15` | `36px` تا `80px` | layoutهای بزرگ و desktop |

## Tokenهای semantic

برای اجزای محصول از tokenهای semantic استفاده کنید: `--space-page-inline` برای حاشیهٔ محتوای صفحه، `--space-page-block` برای فاصلهٔ عمودی صفحه، `--space-section` برای جداسازی بخش‌ها، `--space-card` برای padding کارت، `--space-control` برای gap کنترل‌ها و `--space-stack` برای چیدمان عمودی.

این tokenها در breakpoint موبایل مقدارهای فشرده‌تری می‌گیرند و نیازی به تعریف دوباره در هر کامپوننت ندارند. برای اجزای جدید، utilityهای `.space-stack`، `.space-stack-compact`، `.space-inline`، `.space-section`، `.space-page` و `.space-card` نیز آماده هستند.

## قواعد نگهداری

عدد خام برای `gap`، `padding` و `margin` فقط زمانی مجاز است که مقدار بخشی از یک جزئیات بصری خاص باشد؛ در غیر این صورت باید به token تبدیل شود. `--space-0` را فقط برای حذف آگاهانهٔ فاصله استفاده کنید و هر layout جدید باید در عرض ۳۲۰ تا ۳۷۵ پیکسل از overflow افقی و چسبیدن کنترل‌ها جلوگیری کند.
