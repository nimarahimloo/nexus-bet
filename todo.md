# Project TODO

- [x] بررسی دقیق ساختار، مسیرها و تعاملات وب‌سایت مرجع Betprofa.
- [x] مستندسازی ویژگی‌های قابل مشاهدهٔ مرجع و شناسایی جریان‌های احراز هویت‌شدهٔ نیازمند طراحی مستقل.
- [x] طراحی معماری فارسی‌محور و راست‌به‌چپ برای صفحهٔ خانه، رویدادها، کیف پول و حساب کاربری.
- [x] طراحی معماری فارسی‌محور و راست‌به‌چپ برای صفحهٔ خانه، رویدادها، کیف پول و حساب کاربری.
- [x] پیاده‌سازی سیستم بصری مشکی، بنفش و فیروزه‌ای با گلس‌مورفیسم الهام‌گرفته از Apple.
- [x] ایجاد ناوبری ورزش‌ها، فیلتر لیگ‌ها و نمایش رویدادهای ویژه، زنده و آینده.
- [x] ایجاد کارت‌های بازار ضریب با وضعیت مسابقه و تعامل انتخاب بازار.
- [x] پیاده‌سازی بت‌اسلیپ تعاملی شامل انتخاب‌های متعدد، مبلغ USDT، بازده تخمینی و خلاصهٔ پیش‌تأیید.
- [x] طراحی کیف پول حرفه‌ای USDT با موجودی قابل‌استفاده، موجودی قفل‌شده و شبکه‌های واریز.
- [x] ایجاد جریان درخواست برداشت، تأیید امنیتی و تاریخچهٔ وضعیت تراکنش‌های بلاک‌چین.
- [x] ایجاد فضای حساب کاربری برای شرط‌های باز، تاریخچهٔ تسویه، فعالیت کیف پول، پروفایل، امنیت و پشتیبانی.
- [x] افزودن سطوح تجربهٔ بازی مسئولانه شامل تأیید سن، هشدار ریسک، محدودیت‌ها و پیوند شرایط استفاده.
- [x] پوشش تعاملات اصلی با تست واحد و بررسی واکنش‌گرایی و کیفیت ظاهری.
- [x] ثبت نسخهٔ نهایی پروژه پس از بازبینی همهٔ موارد.

- [x] افزودن بخش Nexus AI برای پیشنهاد شرط‌های جذاب، پرطرفدار و دارای سطح ریسک.
- [x] اتصال پیشنهادهای هوشمند به انتخاب‌های بت‌اسلیپ و محاسبهٔ بازده.
- [x] نمایش توضیح شفاف، سیگنال‌های داده‌ای و هشدار «عدم تضمین سود» برای هر پیشنهاد.
- [x] افزودن تست واحد برای امتیازدهی پیشنهادها، ریسک و انتخاب پیشنهاد در بت‌اسلیپ.
- [x] بازبینی واکنش‌گرایی بخش Nexus AI و ثبت checkpoint ارتقایافته.

## Design decision
Nexus AI در این نسخه به‌صورت یک موتور پیشنهاددهی قابل‌اعتنا در سمت محصول پیاده می‌شود: پیشنهادها از دادهٔ رویداد/ضریب و سیگنال‌های قابل توضیح ساخته می‌شوند و UI با قرارداد آمادهٔ اتصال به مدل زبانی داخلی توسعه می‌یابد. این کار از نمایش ادعاهای مبهم یا تضمین سود جلوگیری می‌کند و مسیر اتصال به دادهٔ ورزشی زنده را برای مرحلهٔ بعد باز می‌گذارد.

## Nexus AI acceptance criteria
- هر پیشنهاد باید شامل رویداد، بازار، ضریب، سطح ریسک، سیگنال‌های توضیح‌پذیر و وضعیت محبوبیت باشد.
- پیشنهادها نباید با زبان تضمین سود یا توصیهٔ قطعی نمایش داده شوند.
- کاربر باید بتواند پیشنهاد را به‌صورت یک کلیک به بت‌اسلیپ اضافه یا حذف کند.
- محاسبهٔ مبلغ و بازده احتمالی باید از همان منطق بت‌اسلیپ موجود استفاده کند.
- در موبایل کارت‌ها باید خوانا و بدون پوشاندن بلیت پیش‌بینی باشند.
- منطق امتیازدهی باید تست واحد داشته باشد.

## Data note
دادهٔ واقعی زندهٔ مسابقات و ضرایب در این پروژه هنوز به ارائه‌دهندهٔ ورزشی متصل نیست؛ بنابراین پیشنهادهای رابط فعلی در این مرحله به‌عنوان پیشنهادهای نمونهٔ قابل‌توضیح و غیرتضمینی ارائه می‌شوند، نه سیگنال مالی واقعی.

- [x] افزودن انیمیشن ورود و بازخورد بصری هنگام اضافه‌شدن پیشنهاد Nexus AI به بت‌اسلیپ.
- [x] افزودن بازخورد حذف/انتخاب مجدد و رعایت prefers-reduced-motion.
- [x] نمایش زندهٔ مبلغ شرط، ضریب ترکیبی، سود احتمالی خالص و بازگشت کل با واحد USDT.
- [x] نمایش وضعیت‌های خالی، مبلغ نامعتبر و تغییرات لحظه‌ای سود در بت‌اسلیپ.
- [x] افزودن تست محاسبهٔ سود احتمالی و بازبینی دسکتاپ/موبایل.
- [x] ثبت checkpoint جدید پس از اعتبارسنجی نهایی.

## Interaction decision
با هر تغییر در انتخاب‌ها یا مبلغ شرط، سود احتمالی و بازگشت کل بدون تأخیر قابل مشاهده به‌روزرسانی می‌شوند. انیمیشن‌ها کوتاه، مبتنی بر transform/opacity و قابل خاموش‌شدن با prefers-reduced-motion خواهند بود تا بازخورد جذاب باشد اما مزاحم تصمیم‌گیری نشود.

- [x] افزودن مدل کاربرمحور موجودی USDT در دیتابیس با موجودی قابل‌استفاده و قفل‌شده.
- [x] افزودن endpoint امن برای خواندن موجودی کیف پول کاربر و حالت کاربر مهمان.
- [x] اتصال اعتبارسنجی stake و سود احتمالی بت‌اسلیپ به موجودی backend.
- [x] نمایش هشدار لحظه‌ای کمبود موجودی هنگام تایپ stake یا تغییر انتخاب‌ها.
- [x] جلوگیری از ثبت بلیت در حالت کمبود موجودی و افزودن تست‌های backend/frontend logic.
- [x] بازبینی حالت مهمان، loading/error و موبایل و ثبت checkpoint جدید.

## Wallet balance decision
موجودی واقعی در این مرحله به‌معنای موجودی پایدار و کاربرمحور در backend است، نه مقدار ثابت در React. واریز/برداشت بلاکچینی هنوز به provider و تسویهٔ واقعی متصل نشده؛ بنابراین endpoint کیف پول تنها منبع اعتبارسنجی UI و آمادهٔ اتصال به ledger واقعی خواهد بود. برای کاربر مهمان، بت‌اسلیپ فقط به‌صورت نمایشی قابل مشاهده است و ثبت شرط نیازمند ورود و موجودی کافی خواهد بود.

- [x] استخراج و آماده‌سازی وزن‌های فونت Peyda و Kalameh از فایل‌های ارسالی.
- [x] جایگزینی رنگ‌های گرادینتی با بنفش عمیق یکدست و تعریف سلسله‌مراتب مشکی/بنفش/فیروزه‌ای.
- [x] تولید لوگوی اختصاصی Nexus Bet و آماده‌سازی آن برای استفاده در رابط.
- [x] تولید تصاویر متنوع برای hero، مسابقات، کیف پول و بخش Nexus AI.
- [x] اعمال فونت‌ها، letter-spacing نرمال و دارایی‌های تصویری در کل سایت.
- [x] بازبینی بصری واکنش‌گرا و ثبت checkpoint جدید.

- [x] تعریف سطوح VIP، امتیاز فعالیت، آستانهٔ پیشرفت و مزایای هر سطح.
- [x] افزودن بخش Nexus VIP با نوار پیشرفت، سطح فعلی و فاصله تا سطح بعدی.
- [x] طراحی کارت‌های جوایز اختصاصی و وضعیت دریافت/قفل هر جایزه.
- [x] افزودن تعامل مشاهدهٔ جزئیات و دریافت جایزه بدون ادعای پاداش واقعی یا ساختگی.
- [x] بازبینی واکنش‌گرایی، تست منطق progress و ثبت checkpoint جدید.

- [x] بررسی نمونه‌های مشابه sportsbook از نظر ناوبری موبایل، بازارها، bet slip، لایو و حساب کاربری.
- [x] ثبت یافته‌های تحقیق و تعریف اولویت‌های تجربهٔ موبایل Nexus Bet.
- [x] تکمیل قابلیت‌های اصلی sportsbook شامل جست‌وجو، مسابقات محبوب، بازارهای بیشتر، live center و history.
- [x] بازطراحی bet slip و مسیر تأیید برای موبایل با microcopy طبیعی‌تر.
- [x] بازنویسی متن‌های عمومی و ماشینی سراسر سایت با لحن کوتاه، انسانی و قابل‌اعتماد.
- [x] اجرای تست مسیرهای اصلی و بازبینی موبایل/دسکتاپ و ثبت checkpoint جدید.

- [x] تبدیل ساختار تک‌صفحه‌ای به مسیرهای جدا برای خانه، مسابقات، کیف پول، Nexus AI، VIP و حساب کاربری.
- [x] حذف modal تأیید سن از بارگذاری اولیه و انتقال آن به مسیر مسئولانه/شرایط استفاده.
- [x] تولید و استفاده از hero مستقل برای هر صفحه با تصاویر مختص همان بخش.
- [x] یکپارچه‌سازی کامل اعداد فارسی و وزن‌های فونت ارسالی در همهٔ صفحات و کارت‌ها.
- [x] ساخت صفحهٔ مجزای انفجار با ضریب زنده، وضعیت بازی، تاریخچهٔ دورها و bet slip مستقل.
- [x] اتصال مسابقات و وضعیت‌های live به API ورزشی واقعی با مدیریت secret، loading و خطا.
- [x] بازبینی موبایل‌فرست همهٔ مسیرها و تست مسیرهای اصلی پیش از checkpoint جدید.

- [x] نمایش چند مسابقهٔ نمایشی تا زمان ورود SPORTS_API_KEY، با برچسب روشن «نمونه» و بدون ادعای زنده‌بودن.
- [x] افزودن لوگوهای تیم‌ها به کارت‌های مسابقه و استفاده از assetهای پایدار پروژه.
- [x] نگه‌داشتن ساختار داده برای جایگزینی مستقیم با API واقعی پس از دریافت کلید.
- [x] اجرای تست و بازبینی موبایل حالت موقت مسابقات.

- [x] ایجاد surface واقعی شرایط استفاده و بازی مسئولانه با تأیید سن غیرمسدودکننده.
- [x] افزودن برچسب واضح «نمونه» و حذف نشانه‌های live واقعی از دادهٔ موقت قبل از API.
- [x] حذف لوگوی نامرتبط از مسابقهٔ تنیس و استفاده از نشان ورزشی مناسب.
- [x] ایجاد contract/mapper تست‌پذیر برای تبدیل response API ورزشی به Match.

- [x] ساخت محتوای واقعی قوانین/بازی مسئولانه با تأیید سن غیرمسدودکننده و جایگزینی toast شرایط استفاده.
- [x] هم‌راستا کردن mapper مسابقات با مدل Match واقعی شامل markets و insight و استفاده از adapter در مسیر اصلی داده.

- [x] اتصال مسیر دادهٔ مسابقات Home به adapter مشترک به‌جای مصرف مستقیم آرایهٔ جداگانه.
- [x] افزودن تست اثبات‌کنندهٔ تولید دادهٔ مصرفی UI از contract مشترک مسابقات.

- [x] استخراج سازندهٔ demo matches از Home به helper مشترک و افزودن تست مسیر مصرف adapter توسط UI.

- [x] تولید و اتصال hero مستقل برای صفحهٔ حساب کاربری.
- [x] ایجاد utility سراسری formatFaNumber و استفادهٔ آن در صفحات مستقل و کارت‌های اصلی.
- [x] افزودن تست واحد utility اعداد فارسی و smoke test قرارداد routeهای مستقل.

- [x] ممیزی نمایش اعداد در Matches، Crash، PageShell و کارت‌های routeهای مستقل و مهاجرت به formatter مشترک.
- [x] افزودن تست تکمیلی برای پوشش formatter مشترک در تمام مسیرهای مستقل دارای عدد.

- [x] انتقال نمایش زمان/ضریب صفحهٔ Matches به helperهای عددی مشترک به‌جای رشته‌های دستی.
- [x] ممیزی PageShell و routeهای عدددار و استخراج helper نمایشی قابل‌تست برای آن‌ها.
- [x] افزودن تست مستقیم data-to-display برای Matches و Crash و helperهای عددی مشترک.

- [x] انتقال odds صفحهٔ Matches به دادهٔ عددی و formatFaDecimal، با برچسب market جدا از مقدار.
- [x] استخراج helperهای خروجی نمایشی Matches و Crash و ثبت صریح اینکه PageShell عددی ندارد.
- [x] افزودن تست مستقیم رشته‌های نمایش زمان، odds، stake و cashout برای routeهای مستقل.

- [x] ثبت قرارداد صریح و قابل‌تست اینکه PageShell هیچ مقدار عددی رندر نمی‌کند.
- [x] افزودن assertion جداگانه برای stake و cashout در خروجی نمایشی Crash.

- [x] استخراج helper مستقیم رشته‌های نمایش Crash شامل مبلغ و واحد USDT و تست خروجی نهایی هر دو سطر.

- [x] اتصال live center به endpoint واقعی fixtures/live و حذف محتوای هاردکد.
- [x] نمایش هشدار صریح Home برای source=fallback و error برگشتی از procedure.
- [x] افزودن تست قرارداد live و سناریوی fallback/error فید ورزشی.

- [x] افزودن تست backend برای قرارداد sports.live و sports.fixtures شامل source، matches و fallback error.
- [x] افزودن تست contract برای متن وضعیت fallback فید ورزشی Home.

- [x] افزودن assertion مستقل برای مسیر fixtures?next=10 و پیام fallback مخصوص fixtures در sportsFeed.

- [x] افزودن مودال جزئیات با بازشدن از روی هر کارت مسابقه و بستن با دکمه، کلیک بیرون و Escape.
- [x] افزودن قرارداد جزئیات مسابقه شامل آمار، ترکیب تیم‌ها و رویدادهای مهم با fallback نمونه.
- [x] اتصال دادهٔ واقعی جزئیات API-Football با loading/error و حفظ دادهٔ نمونهٔ شفاف.
- [x] افزودن تست‌های واحد برای mapper جزئیات و stateهای مودال و بازبینی موبایل.

- [x] افزودن source و error به قرارداد sports.details و fallback نمونهٔ صریح در مودال.
- [x] استخراج stateهای مودال به helper قابل‌تست و پوشش بازشدن، بستن، تب‌ها و loading/error/empty.

- [x] مصرف getMatchDetailsStatus در UI برای یکپارچه‌سازی stateهای loading/error/demo/empty.
- [x] افزودن contract قابل‌تست برای بازشدن کارت و بستن با دکمه، بیرون مودال و Escape.

- [x] انتقال empty state تب‌ها به helper تب‌محور و مصرف آن در مودال.
- [x] افزودن assertion مستقیم open/close/backdrop برای contract مودال.

## Bet303 redesign audit
- [x] بررسی مرجع bet303.bet روی موبایل و استخراج قابلیت‌ها، الگوهای ناوبری و مسیرهای اصلی sportsbook.
- [x] ممیزی UI/UX فعلی Nexus Bet و ثبت مشکلات قابل‌مشاهده در hierarchy، خوانایی، تعامل و discoverability.
- [x] طراحی نقشهٔ قابلیت‌های جدید و اولویت اجرای mobile-first برای Nexus Bet.
- [x] بازطراحی shell موبایل، ناوبری، هوم sportsbook و مسیرهای کلیدی بر اساس یافته‌های audit.
- [x] افزودن قابلیت‌های قابل‌مشاهدهٔ اولویت‌بالا با stateهای واقعی و تست واحد.
- [x] اجرای ممیزی responsive، تست و ثبت checkpoint جدید.

## Bonus and tournament interaction pass
- [x] غنی‌سازی دادهٔ نمونهٔ بونوس با دسته، وضعیت، مهلت، شرایط و progress قابل‌مشاهده.
- [x] غنی‌سازی دادهٔ نمونهٔ تورنمنت با رتبه‌بندی، امتیاز، زمان، جایزهٔ نمایشی و قوانین.
- [x] افزودن تعامل نمایش جزئیات، انتخاب دسته و تغییر وضعیت کارت‌ها.
- [x] افزودن motion کنترل‌شده برای progress، hover و بازشدن جزئیات با prefers-reduced-motion.
- [x] اجرای تست، بازبینی موبایل و ثبت checkpoint جدید.

## Typography and Apple-inspired design system pass
- [x] ممیزی منبع و وزن‌های واقعی Peyda/Kalameh و اعمال font-family مشترک روی همهٔ عناصر متنی و کنترل‌ها.
- [x] تعریف سلسله‌مراتب typography، line-height، letter-spacing نرمال و tokenهای spacing/radius/shadow.
- [x] بازطراحی glass surfaceها، border، blur، focus/hover/pressed state و کاهش ظاهر کارت‌های تکراری.
- [x] اجرای ممیزی responsive، تست و ثبت checkpoint جدید.

## Real data and mobile material pass
- [x] ممیزی endpointها و حذف/برچسب‌گذاری داده‌های تزئینی در مسیرهای اصلی.
- [x] اتصال وضعیت‌های feed، wallet، offers و tournaments به قراردادهای دادهٔ قابل‌ردیابی با source/error.
- [x] بازطراحی mobile shell با bottom dock، drawer، safe-area و hierarchy قابل اسکن.
- [x] بازطراحی glass material با لایه‌های translucent، hairline border، blur و stateهای لمسی.
- [x] افزودن تست contract برای source/error و مسیرهای mobile و ثبت checkpoint جدید.

## Mobile matches bottom-sheet pass
- [x] بازطراحی صفحهٔ Matches برای فیلترهای sticky با safe-area و وضعیت active واضح.
- [x] تبدیل bet slip موبایل به bottom sheet با handle، خلاصهٔ انتخاب‌ها، مبلغ USDT و بازگشت احتمالی.
- [x] افزودن تعامل باز/بسته‌شدن، backdrop، Escape، focus و motion قابل‌کنترل.
- [x] اجرای تست، بازبینی موبایل/دسکتاپ و ثبت checkpoint جدید.

## Real bet placement pass
- [x] ممیزی schema و helperهای wallet برای طراحی ثبت اتمیک بلیت و قفل‌کردن موجودی.
- [x] افزودن جدول/قرارداد bet slip و procedure protected برای validate مبلغ، موجودی و odds.
- [x] اتصال CTA bottom sheet به mutation و نمایش confirmation/error واقعی.
- [x] افزودن فیلتر لیگ و هشدار odds تغییرکرده پیش از ثبت.
- [x] افزودن تست‌های backend و UI، بازبینی موبایل و ثبت checkpoint جدید.

## Platform truth and UI consolidation pass
- [x] ممیزی همهٔ صفحات و مشخص‌کردن هر منبع داده: API واقعی، backend واقعی، نمونهٔ موقت یا متن تزئینی.
- [x] حذف دادهٔ نمونه از مسیرهای عملیاتی یا نمایش برچسب شفاف demo در جاهایی که منبع واقعی نداریم.
- [x] تعریف قرارداد source of truth برای مسابقات، odds، wallet، bets، bonuses و tournaments.
- [x] انتخاب و پیاده‌سازی یک header واحد برای desktop/mobile و حذف variantهای تکراری.
- [x] انتخاب و پیاده‌سازی یک bottom sheet واحد برای bet slip و تعاملات موبایل.
- [x] یکپارچه‌سازی design tokens، spacing، radius، blur و stateهای تعاملی در مسیرهای اصلی.
- [x] افزودن تست audit برای جلوگیری از بازگشت fake data و variantهای duplicate.
- [x] اجرای تست و بازبینی responsive پیش از checkpoint مرحلهٔ اول.

## Operational feed cleanup
- [x] افزودن واکشی odds رسمی API-Football و نگاشت عددی بدون مقدار پیش‌فرض.
- [x] حذف seedها و fallbackهای مسابقه از runtime و تبدیل جزئیات ناموجود به empty state.
- [x] افزودن تست audit برای یک header، یک BetSheet و نبود catalog ساختگی.

## Operational lucky wheel
- [x] ممیزی UI و قرارداد فعلی گردونهٔ شانس و تعیین مدل جایزه/شرایط spin.
- [x] افزودن schema و migration برای spin history و reward ledger اتمیک.
- [x] افزودن procedure امن برای spin، محدودیت دفعات و اعطای جایزه به wallet.
- [x] اتصال UI گردونه به backend و نمایش نتیجه/تاریخچهٔ واقعی.
- [x] افزودن تست‌های backend/UI و بازبینی responsive گردونه.

## Full real-data migration
- [x] ممیزی همهٔ mock/demo/fallbackهای باقی‌مانده و تعیین منبع حقیقت هر route.
- [x] تبدیل Promotions به campaign و activation واقعی از backend.
- [x] تبدیل Tournaments به leaderboard و event ledger واقعی از backend.
- [x] اتصال VIP به activity ledger و محاسبهٔ واقعی tier و progress.
- [x] اتصال Wallet به deposit/withdrawal request و transaction ledger واقعی.
- [x] اتصال Casino/Cash/Crash به catalog، round و settlement واقعی یا حذف صریح مسیرهای فاقد provider.
- [x] تکمیل Account با bet history، reward history و wallet transaction history واقعی.
- [x] حذف fallbackهای عملیاتی گمراه‌کننده و افزودن source/error/empty state صریح.
- [x] افزودن تست‌های data-truth، procedure و route برای تمام مسیرهای مهاجرت‌یافته.
- [x] بازبینی responsive و ثبت checkpoint مهاجرت دادهٔ واقعی.

## iOS-inspired mobile UX redesign
- [x] ممیزی بصری صفحات موبایل و ثبت تصمیم‌های طراحی برگرفته از نمونه‌های معتبر.
- [x] بازتعریف tokenهای glass، surface، border، typography و safe-area مطابق زبان بصری iOS.
- [x] اعمال تضمین‌شدهٔ Peyda و Kalameh روی همهٔ کنترل‌ها، فرم‌ها، اعداد و routeها.
- [x] بازطراحی Home و Matches با hierarchy موبایلی، کارت‌های قابل‌اسکن و bet slip جذاب.
- [x] بازطراحی PageShell، header و bottom navigation برای تراکم و لمس بهتر در موبایل.
- [x] همسان‌سازی routeهای Wallet، Rewards، Crash، AI و featureها با design system جدید.
- [x] افزودن/به‌روزرسانی تست‌های قرارداد UI و بازبینی screenshot موبایل/دسکتاپ.

## In-platform auth and AI support
- [x] ممیزی triggerهای ورود، خروج و پشتیبانی فعلی در تمام routeها.
- [x] ساخت Auth modal شامل login، signup، forgot password و validation سمت رابط.
- [x] افزودن دکمه‌های Google، Discord، Facebook و Apple بدون redirect در نسخهٔ preview.
- [x] اتصال همهٔ CTAهای ورود به Auth modal داخلی و حذف وابستگی ورود از مسیرهای رابط.
- [x] ساخت پنل پشتیبانی داخلی با گفت‌وگوی Nexus AI، loading/error و پاسخ فارسی.
- [x] جایگزین‌کردن دکمهٔ شناور پشتیبانی با launcher و sheet داخلی سازگار با safe-area.
- [x] افزودن تست flowهای Auth/Support و بازبینی responsive موبایل و دسکتاپ.

## Auth modal glass and motion pass
- [x] ممیزی حالت‌های ورود، ثبت‌نام و بازیابی رمز برای motion و glass material.
- [x] افزودن ambient glass layers، refractive highlight و depth به backdrop و modal.
- [x] افزودن transitionهای باز/بسته، تغییر mode و تعامل providerها با رعایت reduced-motion.
- [x] افزودن تست قرارداد motion/material و بازبینی موبایل و دسکتاپ.

## Local authentication backend
- [x] طراحی مدل credential، session و بازیابی رمز برای Auth داخلی.
- [x] افزودن schema و migration برای credentialهای رمزنگاری‌شده و reset token.
- [x] پیاده‌سازی ثبت‌نام، ورود، logout و بازیابی/تغییر رمز با tRPC و cookie امن.
- [x] اتصال Auth modal به mutationهای واقعی و refresh وضعیت session.
- [x] حفظ provider buttonهای نمایشی بدون redirect خارجی.
- [x] افزودن تست‌های credential، session، validation و بازبینی responsive flow کامل.

## Navigation and spacing reliability pass
- [x] ممیزی trigger و state منوی همبرگری در mobile shell.
- [x] رفع باز/بسته‌شدن drawer و افزودن backdrop، Escape و focusهای قابل‌دسترسی.
- [x] تعریف حداقل padding لمسی دکمه‌ها و gapهای سراسری برای کنترل‌ها و گروه‌ها.
- [x] رفع spacing فشرده در header، navigation، کارت‌ها، فرم‌ها و CTAهای routeهای اصلی.
- [x] افزودن تست قرارداد hamburger/spacing و بازبینی موبایل و دسکتاپ.

## Hero asset and font recovery pass
- [x] ممیزی همهٔ ارجاع‌های تصویری، heroهای routeها و نشانی‌های asset شکسته.
- [x] بازیابی یا جایگزینی hero یکتا برای هر route دارای صفحهٔ مستقل.
- [x] تولید و اتصال تصاویر مکمل برای بخش‌های کلیدی بدون حذف دارایی‌های سالم.
- [x] روشن‌سازی لایهٔ overlay روی heroها با حفظ خوانایی متن.
- [x] تثبیت font-face و font stack برای تمام عناصر، فرم‌ها و routeها.
- [x] افزودن تست قرارداد asset/font و بازبینی موبایل و دسکتاپ.

## Full spacing and mobile regression audit
- [x] ممیزی grid/flexهای routeها برای gap، padding، margin و min-width صفر.
- [x] تعریف guardrailهای CSS برای عدم overlap، overflow-x و safe-area موبایل.
- [x] اصلاح تراکم کارت‌ها، toolbarها، فرم‌ها و CTAها در routeهای پرریسک.
- [x] افزودن تست static spacing و responsive contract برای جلوگیری از regression.
- [x] بازبینی همهٔ routeهای کلیدی در viewportهای موبایل و ثبت checkpoint.

## Global live motion system
- [x] ممیزی نقاط تعامل و تدوین الگوی motion سراسری با محدودیت زمان و performance.
- [x] افزودن زیرساخت motion مشترک برای ورود، hover، press، skeleton و state transition.
- [x] افزودن motionهای اختصاصی hero، کارت‌های odds، feature hub، گردونه و Crash.
- [x] افزودن motionهای تکمیلی Auth modal، Support panel، drawer و navigation.
- [x] رعایت `prefers-reduced-motion` و جلوگیری از animationهای layout-shifting.
- [x] افزودن تست قرارداد motion و بازبینی routeهای موبایل/دسکتاپ.

## Custom in-app notifications
- [x] تعریف مدل notification کاربرمحور شامل عنوان، متن، نوع، لینک، خوانده‌شدن و زمان ایجاد.
- [x] افزودن migration و procedureهای امن برای فهرست اعلان‌ها، شمارندهٔ خوانده‌نشده و mark-as-read.
- [x] افزودن پنل اعلان glass در header و حالت موبایل با empty/loading/error states.
- [x] اتصال رویدادهای واقعی محصول به اعلان‌ها بدون seed یا دادهٔ ساختگی.
- [x] افزودن تست‌های backend/UI و بازبینی responsive پیش از checkpoint.

## Spacing audit and mobile layout refinement
- [x] ممیزی فاصله‌های padding، margin و gap در shell، routeها، کارت‌ها و فرم‌ها.
- [x] افزایش و یکدست‌سازی spacingهای کم یا صفر با حفظ design tokens موجود.
- [x] اصلاح overflow، safe-area و touch targetها در viewportهای موبایل.
- [x] افزودن تست regression برای spacing و بازبینی responsive پیش از checkpoint.

## Standard spacing token system
- [x] ممیزی tokenهای spacing فعلی و الگوهای پراکندهٔ padding، margin و gap.
- [x] تعریف مقیاس spacing استاندارد با tokenهای semantic و responsive.
- [x] جایگزینی نقاط کلیدی پروژه با tokenهای مشترک بدون تغییر ناخواسته در layout.
- [x] افزودن مستندات مصرف و guardrailهای CSS برای توسعه‌های آینده.
- [x] افزودن تست regression، بازبینی responsive و ثبت checkpoint.

## Crash bet backend incident
- [x] ردیابی خطای «عملیات انجام نشد» از Crash UI تا موجودی، round فعال و ثبت bet.
- [x] ممیزی اینکه wallet، round lifecycle و bet status در مسیر عملیاتی از backend واقعی استفاده می‌کنند.
- [x] اصلاح قرارداد یا تراکنش Crash بدون افزودن mock/fake operational data.
- [x] افزودن تست برای موجودی ناکافی، round نامعتبر، ثبت bet موفق و وضعیت‌های خطا.
- [x] بازبینی UI error/loading states و ثبت checkpoint پس از اعتبارسنجی.

## Betting history profile page
- [x] ممیزی مدل bets، selections و query فعلی کاربر.
- [x] افزودن query جزئیات‌دار و امن برای تاریخچهٔ شرط‌بندی کاربر.
- [x] ساخت صفحهٔ تاریخچه با تب‌های pending، won و lost و empty states واقعی.
- [x] نمایش جزئیات مبلغ، ضریب، بازگشت، انتخاب‌ها و زمان با RTL و USDT.
- [x] اتصال صفحه به پروفایل، تست backend/UI و بازبینی responsive پیش از checkpoint.

## Nexus AI support response incident
- [x] ممیزی AIChatBox، support.chat و helper داخلی LLM.
- [x] اصلاح mapping مدل‌های GPT-5 از max_tokens به max_completion_tokens.
- [x] افزایش ظرفیت conversation، حفظ context آخرین پیام‌ها و مدیریت پاسخ content خالی.
- [x] بهبود system prompt برای پاسخ‌گویی آزاد و مرتبط فارسی به سؤالات کاربران.
- [x] افزودن تست contract، اجرای smoke request واقعی provider و اعتبارسنجی UI flow.
