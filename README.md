# نگین خودرو | Negin Khodro

وب‌سایت نمایشگاه نگین خودرو با Astro، React، Tailwind CSS و Supabase؛ آماده انتشار روی هاست لینوکس اشتراکی Apache.

## معماری نسخه هاست اشتراکی

این نسخه با `output: static` ساخته می‌شود. صفحات اصلی، محتوا، پنل مدیریت و فایل‌های JavaScript/CSS به HTML و Assetهای عادی تبدیل می‌شوند. سرور هاست فقط فایل‌ها را ارائه می‌کند و نیازی به Node.js دائمی، PM2، Passenger یا Render Web Service ندارد.

داده‌های کاتالوگ در زمان بازدید از Supabase خوانده می‌شوند:

- ویترین و فهرست خودروها بدون Build مجدد به‌روز می‌شوند.
- جزئیات خودروهای موجود در زمان Build به‌صورت HTML مستقل با متادیتای اولیه و JSON-LD ساخته می‌شوند.
- Slug خودروهای تازه از طریق Rewrite آپاچی به `vehicle.php` می‌رسد. PHP متادیتای اختصاصی را برای خزنده‌ها تولید می‌کند و مرورگر محتوای جزئیات را از Supabase تازه‌سازی می‌کند.
- `sitemap.php` نقشه سایت زنده را از Supabase تولید می‌کند.

## فناوری‌ها

- Astro 5 و React 19
- Tailwind CSS 4
- Supabase Auth، PostgreSQL و Storage
- Apache `.htaccess` برای مسیرهای خودروهای جدید
- PHP 8+ فقط برای Metadata Bridge و Sitemap زنده

## ساخت محلی در Windows PowerShell

```powershell
Copy-Item .env.example .env
notepad .env
npm ci
npm run build
```

فایل `.env` را با مقادیر واقعی تکمیل کنید:

```dotenv
PUBLIC_SITE_URL=https://neghinkhodro.com
PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
PUBLIC_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_OR_PUBLISHABLE_KEY
```

از کلید عمومی `anon` یا `publishable` استفاده کنید. استفاده از `service_role` یا `sb_secret_` در این معماری ممنوع است. اسکریپت پس از Build، متغیرها را اعتبارسنجی می‌کند، فایل‌های Apache را به خروجی کپی می‌کند و فایل پیکربندی محافظت‌شده PHP را در `dist/_private/` می‌سازد.

## انتشار روی هاست

محتوای پوشه `dist/` را مستقیماً در `public_html/` آپلود کنید. هاست باید Apache با `mod_rewrite`، فایل `.htaccess` و PHP 8+ داشته باشد. برای تولید زنده Sitemap و metadata خودروهای تازه، PHP cURL یا `allow_url_fopen` نیز لازم است.

راهنمای کامل در [`HOSTING-README.md`](./HOSTING-README.md) قرار دارد.

## مسیرهای اصلی

- `/` صفحه اصلی
- `/vehicles/` موجودی و فیلتر خودروها
- `/vehicle/<slug>/` جزئیات هر خودرو
- `/modiriyat/` پنل مدیریت
- `/sitemap.xml` نقشه سایت زنده
- `/robots.txt` دستورهای خزنده‌ها
- `/healthz.json` فایل بررسی استاتیک

## Supabase و داده‌ها

ساختار فعلی دیتابیس، جدول‌های `admins`، `brands`، `categories`، `vehicles`، `inquiries` و `settings`، احراز هویت و Bucket تصاویر حفظ شده‌اند. این نسخه برای تغییر هاست، Migration جدیدی به دیتابیس تحمیل نمی‌کند.

Migrationهای پوشه `supabase/migrations` را فقط در پروژه تازه به ترتیب اجرا کنید. در پروژه موجود، Migrationهای اجراشده را دوباره اجرا نکنید. Policyهای موجود باید دسترسی عمومی به خودروهای فعال و دسترسی مدیریتی را از طریق RLS کنترل کنند.

## نکات انتشار

- آپدیت موجودی، ایجاد خودرو، ویرایش اطلاعات و انتشار/عدم انتشار از پنل مدیریت، زنده و بدون Build است.
- برای تغییر کد، طراحی یا محتوای ثابت سایت، Build و آپلود دوباره خروجی `dist/` لازم است.
- HTML خودروهایی که از قبل هنگام Build تولید شده‌اند، متادیتای کامل اولیه دارند؛ برای Slugهای جدید، PHP متادیتا را در زمان درخواست تولید می‌کند.
- کلید Supabase در خروجی JavaScript عمومی است؛ امنیت بر اساس کلید پنهان نیست و به RLS/GRANTهای پایگاه داده متکی است.
