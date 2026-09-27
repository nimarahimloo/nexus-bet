# Cypress — تست واکنش‌گرا

## پیش‌نیاز

1. سرور dev روی `http://localhost:3000`:

```bash
docker start nexus-mysql   # در صورت نیاز
pnpm dev
```

2. نصب Cypress (یک‌بار):

```bash
pnpm add -D cypress
```

## اجرا

```bash
# headless
pnpm test:e2e

# UI تعاملی
pnpm test:e2e:open
```

متغیر اختیاری:

```bash
CYPRESS_BASE_URL=http://127.0.0.1:3000 pnpm test:e2e
```

## پوشش

| تست | معیار |
| --- | --- |
| overflow افقی | `scrollWidth <= clientWidth` در 320 / 390 / 768 / 1280 |
| bottom nav | visible زیر ۹۰۰px، مخفی بالای آن |
| topbar | داخل عرض viewport |
| routeها | `/` `/matches` `/crash` `/wallet` `/account` بدون overflow در ۳۹۰px |
| touch target | ارتفاع لینک‌های bottom nav ≥ ۴۴px |
| auth modal | باز شدن روی موبایل بدون overflow |

هم‌تراز با `client/src/ui-responsive.css` و `research_sportsbook_ux.md`.
