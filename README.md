# نگین خودرو | Negin Khodro

وب‌سایت مستقل نمایشگاه نگین خودرو با Astro، React، Tailwind CSS و Supabase. این نسخه هیچ اسکریپت، فرم، Preview Bridge یا سرویس اجرایی B12 ندارد.

## فناوری‌ها

- Astro 5 با خروجی SSR
- Node adapter برای اجرای مستقیم روی Render
- React 19 و Tailwind CSS 4
- Supabase Auth، Postgres و Storage
- صفحات خودرو با رندر سمت سرور و SEO مستقل
- Sitemap و robots.txt پویا

## اجرای محلی

```bash
npm install
cp .env.example .env
npm run dev
```

مقادیر واقعی Supabase را در `.env` قرار دهید. برای کلید عمومی فقط از `anon` یا `publishable` استفاده کنید؛ کلید `service_role` را هرگز در متغیرهای `PUBLIC_` یا کد مرورگر قرار ندهید.

## متغیرهای محیطی Render

| متغیر | مقدار |
|---|---|
| `PUBLIC_SITE_URL` | `https://neghinkhodro.onrender.com` |
| `PUBLIC_SUPABASE_URL` | آدرس پروژه Supabase |
| `PUBLIC_SUPABASE_ANON_KEY` | کلید عمومی anon یا publishable |

این پروژه به دلیل SSR و صفحات پویا باید به‌صورت **Web Service** اجرا شود، نه Static Site. اگر سرویس فعلی Render از نوع Static Site است، یک Web Service جدید از همین مخزن بسازید.

تنظیمات Render:

- Build Command: `npm install && npm run build`
- Start Command: `npm run start`
- Runtime: Node
- Root Directory: ریشه همین پروژه؛ پوشه دیگری را به‌عنوان Root انتخاب نکنید.

## جایگزینی نسخه قبلی در مخزن Git

1. از پوشه فعلی پروژه یک نسخه پشتیبان بگیرید.
2. فایل ZIP اصلاح‌شده را مستقیماً روی ریشه مخزن فعلی Extract کنید و اجازه دهید فایل‌های جدید جایگزین شوند؛ پوشه `.git` ریشه را نگه دارید.
3. در PowerShell از ریشه پروژه اجرا کنید:

```powershell
powershell -ExecutionPolicy Bypass -File .\CLEANUP_OLD_B12.ps1
```

این اسکریپت فقط فایل‌های قدیمی B12 را پاک می‌کند و پوشه Git تو‌در‌توی تکراری را به‌عنوان نسخه پشتیبان به کنار پروژه منتقل می‌کند؛ `.git` اصلی مخزن دست‌نخورده می‌ماند.
4. سپس `npm install` را اجرا و تغییرات را با `git status --short` بررسی کنید.
5. پس از اطمینان، تغییرات را commit و push کنید.

## راه‌اندازی Supabase

فایل‌های SQL پوشه `supabase/migrations` را به ترتیب نام در SQL Editor پروژه Supabase اجرا کنید. اگر مهاجرت‌های قبلی قبلاً اجرا شده‌اند، فقط مهاجرت جدید `20261119100000_independent_site_and_inquiry_security.sql` را نیز اجرا کنید.

حساب مدیر باید در Supabase Auth ساخته شده باشد و ایمیل آن در جدول `public.admins` مجاز باشد. مهاجرت اولیه یک ایمیل اولیه در allowlist ثبت می‌کند؛ پیش از استفاده عملی، آن را با ایمیل مدیر واقعی خود تطبیق دهید.

Bucket تصاویر با نام `negin-uploads` توسط مهاجرت‌ها ساخته می‌شود. Bucket عمومی است تا تصاویر منتشرشده با URL عمومی نمایش داده شوند؛ فهرست‌کردن و نوشتن فایل‌ها به مدیران مجاز محدود است.

## استقرار

```bash
npm install
npm run build
npm run start
```

Render فایل `render.yaml` را نیز می‌تواند به‌عنوان Blueprint بخواند. پس از تنظیم متغیرهای Supabase، Deploy را اجرا کنید.

## مسیرهای اصلی

- `/` صفحه اصلی
- `/vehicles/` فهرست زنده خودروهای موجود در Supabase
- `/vehicle/<slug>/` جزئیات SSR هر خودرو
- `/modiriyat/` پنل مدیریت
- `/sitemap.xml` نقشه سایت پویا
- `/robots.txt` تنظیمات خزنده‌ها

## نکات امنیتی

- مرورگر فقط از کلید عمومی Supabase استفاده می‌کند.
- سیاست RLS ثبت درخواست عمومی را به ایجاد درخواست `pending` محدود می‌کند.
- خواندن و مدیریت درخواست‌ها فقط برای مدیران مجاز است.
- ثبت عمومی درخواست محدودیت طول، شماره تماس و وضعیت `pending` دارد؛ rate limit و CAPTCHA سمت سرور در این نسخه فعال نیست و برای انتشار پرترافیک باید اضافه شود.
- سیاست ناامن تغییر ایمیل allowlist مدیران حذف شده است.
- کلید `service_role` نباید در سایت یا Render به‌عنوان `PUBLIC_` تنظیم شود.

## تصاویر

تصاویر پیش‌فرض محلی و مستقل هستند. تصاویر قبلی روی CDN خارجی B12 قابل انتقال مستقیم در این محیط نبودند و با تصویرهای جایگزین محلی عوض شده‌اند. پیش از انتشار عمومی، تصاویر واقعی خودروها و بنر را از پنل مدیریت به Storage پروژه Supabase بارگذاری کنید.
