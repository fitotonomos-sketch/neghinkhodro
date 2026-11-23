# نگین خودرو | Negin Khodro

وب‌سایت مستقل نمایشگاه نگین خودرو با Astro SSR، React، Tailwind CSS و Supabase.
این نسخه برای اجرا روی Node.js طراحی شده و صفحات موجودی و جزئیات خودرو را در زمان درخواست
از Supabase دریافت می‌کند؛ برای افزودن یا ویرایش خودرو، نیازی به Build مجدد سایت نیست.
فهرست عمومی خودروها برای ۱۵ ثانیه در حافظه هر نمونه SSR کش می‌شود تا بار دیتابیس کمتر شود؛ پس از تغییر موجودی، به‌روزرسانی عمومی معمولاً حداکثر با همین فاصله دیده می‌شود.

## فناوری‌ها

- Astro 5.14 + Node standalone adapter
- React 19 و Tailwind CSS 4
- Supabase Auth، Postgres و Storage
- صفحات داینامیک خودرو با رندر سمت سرور
- Sitemap و robots.txt داینامیک
- Health check در `/healthz.json`

## اجرای محلی در Windows 10 / PowerShell

1. ZIP را در یک پوشه ساده مثل `D:\Work\neghinkhodro` استخراج کنید.
2. PowerShell را در همان پوشه باز کنید و نسخه Node را بررسی کنید:

```powershell
node -v
npm -v
```

3. فایل تنظیمات نمونه را کپی و ویرایش کنید:

```powershell
Copy-Item .env.example .env
notepad .env
```

4. مقادیر واقعی Supabase را در `.env` قرار دهید و سپس اجرا کنید:

```powershell
npm install
npm run dev
```

5. آدرس محلی نمایش‌داده‌شده در ترمینال را در مرورگر باز کنید. برای حالت تولیدی، پس از نصب وابستگی‌ها `npm run build` و سپس `npm run start` را اجرا کنید.

فقط از کلید عمومی `anon` یا `publishable` استفاده کنید. کلید `service_role` یا `sb_secret_` هرگز نباید در متغیرهای `PUBLIC_` یا کد مرورگر قرار بگیرد.

## متغیرهای محیطی

| متغیر | توضیح |
|---|---|
| `PUBLIC_SITE_URL` | آدرس نهایی سایت، بدون اسلش انتهایی |
| `PUBLIC_SUPABASE_URL` | URL پروژه Supabase |
| `PUBLIC_SUPABASE_ANON_KEY` | کلید عمومی anon یا publishable |

نمونه آماده این مقادیر در `.env.example` قرار دارد. در Render همین متغیرها را در بخش Environment تنظیم کنید.

## استقرار Render

این پروژه باید **Web Service** باشد، نه Static Site.

- Plan: `free` برای تست اولیه (در حالت رایگان سرویس پس از بی‌کاری متوقف می‌شود و درخواست اول ممکن است با تأخیر پاسخ بگیرد). برای استفاده تجاری پایدار، پلن دائمی انتخاب کنید.
- Runtime: Node
- Node: `22.16.0`
- Build: `npm install --no-audit --no-fund && npm run build`
- Start: `npm run start`
- Health check: `/healthz.json`
- Root Directory: ریشه مخزن، کنار `package.json` و `astro.config.mjs`

فایل `render.yaml` همین تنظیمات را تعریف می‌کند. ZIP فاقد `package-lock.json` است؛ تلاش برای دریافت Lock از npm registry در محیط آماده‌سازی timeout شد. پس از اولین `npm install` در رایانه توسعه، فایل `package-lock.json` را همراه پروژه Commit کنید و دستور Build در Render را به `npm ci && npm run build` تغییر دهید تا نسخه وابستگی‌ها ثابت بماند. اگر در حال حاضر یک Static Site با همین دامنه دارید، پیش از ایجاد سرویس دوم درباره انتقال دامنه/نام سرویس تصمیم بگیرید؛ دو سرویس نمی‌توانند هم‌زمان یک آدرس `onrender.com` داشته باشند.

## Supabase — اجرای مهاجرت‌ها

1. در Supabase از دیتابیس نسخه پشتیبان بگیرید.
2. اگر پروژه تازه است، migrationهای پوشه `supabase/migrations` را به ترتیب نام اجرا کنید.
3. اگر پروژه قبلاً راه‌اندازی شده، migrationهای اجراشده را دوباره اجرا نکنید؛ فقط migrationهای جدید را اجرا کنید.
4. در پایان، migration جدید `20261122100000_harden_admin_rls_and_grants.sql` را اجرا کنید. این migration Policyهای قدیمی‌ای را که برای خواندن خودروها به جدول خصوصی `admins` وابسته بودند، جایگزین می‌کند.
5. حساب Auth مدیر باید از قبل ساخته و ایمیل آن تأیید شده باشد. مهاجرت اولیه `fitotonomos@gmail.com` را مجاز می‌کند و migration جدید نیز `neghinkhodro@gmail.com` را به allowlist اضافه می‌کند؛ فقط ایمیل حساب واقعی مدیر را نگه دارید و باقی ایمیل‌های غیرضروری را از جدول `public.admins` حذف کنید.
6. Bucket تصاویر `negin-uploads` باید وجود داشته باشد؛ migrationها آن را ایجاد می‌کنند. Bucket عمومی است تا تصاویر منتشرشده از طریق URL عمومی دیده شوند، اما عملیات فهرست‌کردن و نوشتن به مدیر مجاز محدود است.

**مهم:** migration جدید دسترسی عمومی به جدول `admins` نمی‌دهد. نقش `anon` فقط خودروهای موجود، برندها، دسته‌ها و تنظیمات عمومی را می‌خواند؛ نقش `authenticated` فقط ردیف allowlist خودش را می‌بیند.

## مسیرهای اصلی

- `/` صفحه اصلی
- `/vehicles/` موجودی خودروهای فعال
- `/vehicle/<slug>/` جزئیات زنده هر خودرو
- `/modiriyat/` پنل مدیریت
- `/sitemap.xml` نقشه سایت داینامیک
- `/robots.txt` دستورهای خزنده‌ها
- `/healthz.json` سلامت سرویس Render

## امنیت و محدودیت‌ها

- کلید Supabase مرورگر فقط باید public anon/publishable باشد؛ کد کلیدهای `service_role` و `sb_secret_` را رد می‌کند.
- احراز هویت پنل از نشست پایدار مرورگر و تمدید خودکار توکن استفاده می‌کند.
- قیمت خودروهایی که `price_visible=false` دارند به HTML کارت و فیلترهای مرورگر ارسال نمی‌شود.
- Policy عمومی خودروها دیگر به جدول خصوصی مدیران ارجاع نمی‌دهد.
- ثبت عمومی درخواست فقط با وضعیت `pending` و اعتبارسنجی فیلدها مجاز است.
- Rate limit و CAPTCHA سمت سرور هنوز در این نسخه پیاده‌سازی نشده‌اند؛ برای کمپین‌های پرترافیک، Turnstile یا Edge Function دارای محدودیت نرخ اضافه شود.

## تصاویر

تصاویر پیش‌فرض محلی هستند. تصاویر جایگزین نمونه را با تصاویر واقعی و دارای مجوز خودروها جایگزین کنید. تصاویر قدیمی میزبان B12 در این محیط قابل بازیابی نبودند.

## تست پذیرش قبل از انتشار

```powershell
npm install
npm run build
npm run start
```

پس از اجرای محلی، این موارد را بررسی کنید: `/healthz.json`، `/vehicles/`، یک صفحه خودرو، خودرو با قیمت مخفی، ورود مدیر، ذخیره/ویرایش خودرو، آپلود تصویر، ثبت درخواست مشاوره و نمایش `/sitemap.xml`. تست Build باید در محیطی با دسترسی سالم به npm registry انجام شود.
