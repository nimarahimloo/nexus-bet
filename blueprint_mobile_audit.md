# Mobile audit — Watchlist and Smart Alerts

در عرض ۳۹۰ پیکسل، صفحهٔ حساب بدون overflow رندر شد و پنل «مسابقه‌های پیگیری‌شده» در حالت خالی، صادقانه و بدون دادهٔ ساختگی نمایش داده می‌شود. کارت‌های account summary، bet history و empty state فاصله و safe-area مناسب دارند.

در صفحهٔ مسابقات، filter shell و کارت‌های پیش‌نمایش در حالت نبود فید عملیاتی بدون ایجاد بازار یا watchlist جعلی نمایش داده می‌شوند. دکمهٔ پیگیری برای fixtureهای preview عمداً غیرفعال است؛ fixtureهای API واقعی پس از ورود کاربر قابل ذخیره خواهند بود.

Smart Alert فعلاً preference را در backend ذخیره می‌کند و inbox notification را تا زمان وجود trigger/scheduler واقعی تولید نمی‌کند. این محدودیت باید در مستندات محصول باقی بماند و نباید با counter یا activity مصنوعی پوشانده شود.
