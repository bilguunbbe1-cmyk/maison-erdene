# Maison Erdene

Баталгааны гэрчилгээтэй тансаг зэрэглэлийн цүнхний онлайн дэлгүүр. SWE334 Internet Programming хичээлийн улирлын төсөл.

**Maison Erdene бол зохиомол брэнд.** Загвар, зураг, лого нь бүгд энэ төсөлд зориулж шинээр хийгдсэн бөгөөд аль нэг бодит брэндтэй холбоогүй. Цүнхний зургийг `scripts/generate-bag-art.mjs` скрипт үүсгэдэг.

## Төслийн зорилго

Монголд тансаг зэрэглэлийн цүнх худалдан авагчид албан ёсны онлайн суваг ховор, хуурамч барааны эрсдэл өндөр байдаг. Энэ дэлгүүрт цүнх бүрд төлбөр баталгаажмагц давтагдашгүй сериал дугаар олгогдож, жинхэнэ эсэхийг нь хэн ч `/verify` хуудсаар шалгах боломжтой.

Дэлгэрэнгүй: [docs/DESIGN.md](docs/DESIGN.md) (хэрэглэгчийн урсгал, ERD, RLS, төлбөрийн урсгал).

## Хамгаалалтын материал

| Материал | Файл |
|---|---|
| Илтгэл (PPT, PDF) | [docs/presentation](docs/presentation) |
| Wireframe | [docs/wireframes/wireframes.pdf](docs/wireframes/wireframes.pdf) |
| ERD | [docs/erd.png](docs/erd.png) |

## Технологи

| Хэсэг | Технологи |
|---|---|
| Frontend | React + JavaScript (Vite), React Router, Tailwind CSS, Recharts |
| Backend | Supabase: Auth, PostgreSQL, Storage, RLS, Edge Functions |
| Төлбөр | Stripe Checkout (туршилтын орчин) + webhook |
| Байршуулалт | GitHub + Vercel |

## Суулгах заавар (local)

Шаардлагатай: Node.js 20+, Supabase бүртгэл, Stripe бүртгэл.

### 1. Кодоо суулгах

```bash
npm install
```

```bash
cp .env.example .env
```

`.env` файлд Supabase-ийн Project Settings > API хэсгээс URL болон anon түлхүүрийг оруулна.

### 2. Өгөгдлийн сан

```bash
npx supabase login
```

```bash
npx supabase link --project-ref ТАНЫ_PROJECT_REF
```

```bash
npx supabase db push
```

Дараа нь Supabase-ийн SQL Editor дээр `supabase/seed.sql` файлын агуулгыг ажиллуулж, жишээ бүтээгдэхүүнээ оруулна.

### 3. Төлбөрийн функцууд

Stripe-ийн **туршилтын** түлхүүрээ (`sk_test_...`) нууц хувьсагчаар хадгална:

```bash
npx supabase secrets set STRIPE_SECRET_KEY=sk_test_... SITE_URL=http://localhost:5173
```

```bash
npx supabase functions deploy create-checkout
```

```bash
npx supabase functions deploy stripe-webhook
```

Stripe Dashboard > Developers > Webhooks хэсэгт шинэ endpoint нэмнэ:

- URL: `https://ТАНЫ_PROJECT_REF.supabase.co/functions/v1/stripe-webhook`
- Events: `checkout.session.completed`, `checkout.session.expired`

Гарч ирсэн signing secret-ээ хадгална:

```bash
npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

### 4. Нэвтрэлтийн тохиргоо

Supabase > Authentication > URL Configuration хэсэгт Site URL-аа тохируулж, Redirect URLs-д дараахыг нэмнэ: `http://localhost:5173/login`, `http://localhost:5173/reset-password`.

### 5. Ажиллуулах

```bash
npm run dev
```

### 6. Админ үүсгэх

Сайтаар бүртгүүлсний дараа SQL Editor дээр:

```sql
update public.profiles set role = 'admin' where email = 'таны@имэйл.mn';
```

## Vercel дээр байршуулах

1. Кодоо GitHub-д оруулаад Vercel дээр Import хийнэ. Framework нь Vite гэж автоматаар танигдана.
2. Vercel > Settings > Environment Variables хэсэгт `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`-г нэмнэ.
3. Vercel > Settings > Domains хэсэгт өөрийн домэйнээ холбоно. HTTPS автоматаар идэвхжинэ.
4. Төлбөрийн дараах буцах хаягийг шинэчилнэ:

   ```bash
   npx supabase secrets set SITE_URL=https://таны-домэйн.mn
   ```

5. Supabase-ийн Site URL болон Redirect URLs-д шинэ домэйнээ нэмнэ.

`vercel.json` нь `/shop` зэрэг хаягийг шууд нээхэд React Router ажиллах боломж олгодог.

## Төлбөрийг туршиж үзэх

Туршилтын орчин тул жинхэнэ мөнгө гарахгүй.

1. Бүртгүүлж нэвтрээд цүнх сагсанд нэмнэ.
2. Хүргэлтийн мэдээллээ бөглөж «Төлбөр төлөх» дарна.
3. Stripe-ийн хуудсанд дараах туршилтын картыг оруулна: `4242 4242 4242 4242`, ирээдүйн дурын огноо, дурын CVC.
4. Сайт руу буцахад захиалга «Хүлээгдэж буй»-гаас «Төлөгдсөн» болж автоматаар шинэчлэгдэн, гэрчилгээний дугаар гарна.
5. Тэр дугаараа `/verify` хуудсаар шалгана.

## Туршилтын эрх

Хамгаалалт-2-оос өмнө production орчинд үүсгэж, багшид тусад нь өгнө. Нууц үгийг энэ файлд бичихгүй.

| Эрх | Имэйл |
|---|---|
| Админ | _бөглөнө_ |
| Хэрэглэгч | _бөглөнө_ |

## Аюулгүй байдал

- `.env` файл Git-д орохгүй (`.gitignore`). Зөвхөн `VITE_` угтвартай хувьсагч browser-т хүрдэг.
- `service_role` болон Stripe-ийн нууц түлхүүр зөвхөн Supabase secrets дотор байх бөгөөд frontend кодод байхгүй.
- Бүх хүснэгтэд RLS идэвхтэй. Захиалгыг зөвхөн webhook «Төлөгдсөн» болгох боломжтой.

## Бүтэц

```
src/
  components/   Давтан ашиглагдах хэсгүүд (Layout, ProductCard, ui)
  context/      Нэвтрэлт, сагс, хадгалсан барааны нэгдсэн state
  hooks/        useFetch: ачаалж буй / алдаа / өгөгдөл төлөв
  lib/          Supabase холболт, формын шалгалт, форматлах функц
  pages/        Хуудсууд: нийтийн, auth, account, admin
supabase/
  migrations/   0001 хүснэгт · 0002 RLS · 0003 бизнесийн логик
  functions/    create-checkout, stripe-webhook
  seed.sql      Жишээ бүтээгдэхүүн
```
