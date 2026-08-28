# مبنای بازطراحی mobile-first Nexus Bet

## Liquid Glass

- معماری بصری باید ابتدا محتوای مهم را در کانون قرار دهد و navigation ساختاری روشن داشته باشد.
- material شیشه‌ای باید نقش hierarchy داشته باشد، نه این‌که همهٔ کارت‌ها را به یک سطح پرزرق‌وبرق تبدیل کند.
- کنترل‌های اصلی باید به‌صورت floating و با hit-area بزرگ در محدودهٔ شست قرار گیرند.

منبع: Apple Developer, «Liquid Glass» — https://developer.apple.com/documentation/technologyoverviews/liquid-glass

## Sportsbook موبایل

- مسیر اصلی باید کوتاه باشد: یافتن مسابقه → انتخاب market → افزودن به slip → واردکردن stake → تأیید.
- ticket builder چسبان، hit target حداقل 44px، و رفتار motion با reduced-motion نیازهای پایه هستند.
- تغییر odds باید صادقانه و کم‌مزاحمت با cue رنگی/زمانی نمایش داده شود؛ layout نباید هنگام تغییر قیمت جابه‌جا شود.

منبع: Studio Ubique, «Sportsbook UI design, remarkable 60 fps live updates» — https://www.studioubique.com/work/sportsbook-ui-design/
