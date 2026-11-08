# Maison Erdene

Баталгааны гэрчилгээтэй тансаг зэрэглэлийн цүнхний онлайн дэлгүүр. SWE334 Internet Programming хичээлийн улирлын төсөл.

**Maison Erdene бол зохиомол брэнд.** Загвар, лого нь энэ төсөлд зориулж шинээр хийгдсэн бөгөөд аль нэг бодит брэндтэй холбоогүй. Цүнхний зураг, кампанит бичлэгийг AI-аар (Gemini) бүтээсэн. Зураггүй цүнхний зургийг `scripts/generate-bag-art.mjs` скрипт зурдаг. Тусламжийн төвийн утас, имэйл, хаяг нь жишээ утга (`src/lib/contact.js`).

## Төслийн зорилго

Монголд тансаг зэрэглэлийн цүнх худалдан авагчид албан ёсны онлайн суваг ховор, хуурамч барааны эрсдэл өндөр байдаг. Энэ дэлгүүрт цүнх бүрд төлбөр баталгаажмагц давтагдашгүй сериал дугаар олгогдож, жинхэнэ эсэхийг нь хэн ч `/verify` хуудсаар шалгах боломжтой.

Дэлгэрэнгүй: [docs/DESIGN.md](docs/DESIGN.md) (хэрэглэгчийн урсгал, ERD, RLS, төлбөрийн урсгал).

## Хамгаалалтын материал

| Материал | Файл |
|---|---|
| Амьд сайт | [maison-erdene.vercel.app](https://maison-erdene.vercel.app) |
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

**CLI-гүйгээр (Supabase Dashboard-аар) хийх бол:**

1. Edge Functions > Deploy a new function > Via Editor: `create-checkout`, `stripe-webhook` функц бүрийн `index.ts` кодыг хуулж байршуулна.
2. Функц бүрийн Settings хэсэгт **Verify JWT with legacy secret**-ийг унтраана. CLI ашиглавал `supabase/config.toml` үүнийг автоматаар хийдэг. Хэрэглэгчийг `create-checkout` өөрөө, Stripe-ийг `stripe-webhook` гарын үсгээр нь шалгадаг.
3. Edge Functions > Secrets хэсэгт `SITE_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`-ийг нэрийг нь яг ингэж бичиж нэмнэ. Хоёр Stripe түлхүүрийн digest ялгаатай байх ёстой, адилхан бол нэг утгыг хоёр газар хуулсан гэсэн үг.

### 4. Нэвтрэлтийн тохиргоо

Supabase > Authentication > URL Configuration хэсэгт Site URL-аа тохируулж, Redirect URLs-д дараахыг нэмнэ: `http://localhost:5173/**` болон байршуулсан сайтын `https://таны-сайт/**`. `**` нь `/login`, `/reset-password` зэрэг бүх хуудсыг зөвшөөрнө.

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
2. Vercel > Settings > Environment Variables хэсэгт `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`-г нэмнэ. Шинэ Supabase төсөлд anon түлхүүрийн оронд `sb_publishable_...` гэсэн **publishable** түлхүүр байдаг, түүнийг ашиглана. `sb_secret_...` түлхүүрийг хэзээ ч энд бичихгүй.
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

Репозитори нийтэд нээлттэй тул имэйл, нууц үгийг энд бичихгүй. Нэвтрэх мэдээллийг багшид тусад нь өгнө.

| Эрх | Юуг шалгах вэ | Төлөв |
|---|---|---|
| Админ | Самбар, бүтээгдэхүүний CRUD, зураг оруулах, захиалгын төлөв, хэрэглэгч, төлбөр | Үүсгэсэн |
| Хэрэглэгч | Бүртгэл, сагс, захиалга, туршилтын төлбөр, гэрчилгээ | Хамгаалалт-2-оос өмнө үүсгэнэ |

Шинэ хэрэглэгчийг админ болгох: SQL Editor дээр дээрх «Админ үүсгэх» хэсгийн командыг ажиллуулна.

## Аюулгүй байдал

- `.env` файл Git-д орохгүй (`.gitignore`). Зөвхөн `VITE_` угтвартай хувьсагч browser-т хүрдэг.
- `service_role` болон Stripe-ийн нууц түлхүүр зөвхөн Supabase secrets дотор байх бөгөөд frontend кодод байхгүй.
- Бүх хүснэгтэд RLS идэвхтэй. Захиалгыг зөвхөн webhook «Төлөгдсөн» болгох боломжтой.
- Имэйл солиход хуучин болон шинэ хаяг руу тус бүр нэг удаагийн код (эсвэл холбоос) очно. Хоёуланг нь баталгаажуулсны дараа л солигдоно (Supabase-ийн *Secure email change*).
- Утасны дугаарыг browser шууд өөрчилж чадахгүй. `update_my_phone()` функц зөвхөн сүүлийн 10 минутад имэйлийн кодоор нээгдсэн session-оос хүлээн авна (JWT-ийн `amr` claim-ээр шалгана).
- Тусламжийн формыг зочин ч илгээж болно, гэхдээ нэг имэйлээс цагт 5-аас олон хүсэлт хүлээж авахгүй.

### Нэг удаагийн кодыг имэйлд гаргах

Supabase-ийн үндсэн имэйл үйлчилгээ зөвхөн холбоос илгээдэг, загварыг нь засах боломжгүй, мөн зөвхөн төслийн багийн гишүүдийн хаяг руу илгээдэг. Код гаргах бол:

1. Supabase > Authentication > Emails > SMTP Settings хэсэгт өөрийн SMTP-г (жишээ нь Gmail-ийн App Password) тохируулна.
2. Templates хэсгийн **Magic link or OTP** болон **Change email address** загварт `{{ .Token }}` нэмнэ. Жишээ: `<p>Таны код: <strong>{{ .Token }}</strong></p>`.

Код, холбоос хоёулаа ажилладаг тул SMTP тохируулаагүй үед ч хэрэглэгч имэйл дэх холбоосоор баталгаажуулж чадна.

## Бүтэц

```
src/
  components/   Давтан ашиглагдах хэсгүүд (Layout, ProductCard, ui)
  context/      Нэвтрэлт, сагс, хадгалсан барааны нэгдсэн state
  hooks/        useFetch: ачаалж буй / алдаа / өгөгдөл төлөв
  lib/          Supabase холболт, формын шалгалт, форматлах функц
  pages/        Хуудсууд: нийтийн, auth, account, admin
supabase/
  migrations/   0001 хүснэгт · 0002 RLS · 0003 бизнесийн логик · 0004 тусламж, кодоор баталгаажуулах
  functions/    create-checkout, stripe-webhook
  seed.sql      Жишээ бүтээгдэхүүн
```
