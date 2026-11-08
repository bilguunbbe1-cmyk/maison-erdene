# Maison Erdene: шаардлага ба дизайн

## 1. Шийдэж буй асуудал

Монголд тансаг зэрэглэлийн цүнх худалдан авахад гурван бэрхшээл тулгардаг:

1. **Хуурамч бараа.** Худалдан авагч цүнх жинхэнэ эсэхийг өөрөө шалгах аргагүй.
2. **Онлайн суваг дутмаг.** Ихэнх худалдаа сошиал хуудсаар, гар аргаар явагддаг.
3. **Дахин худалдаанд итгэл алга.** Хоёр дахь эзэн цүнхний гарал үүслийг мэдэх боломжгүй.

**Шийдэл, бусдаас ялгарах зүйл:** зарагдсан цүнх бүрд сериал дугаартай цахим гэрчилгээ олгож, нийтэд нээлттэй `/verify` хуудсаар шалгуулна. Гэрчилгээ зөвхөн төлбөр баталгаажсаны дараа webhook-оор үүснэ, тиймээс хуурамчаар үүсгэх боломжгүй. Шалгах хуудас цүнхний мэдээллийг л харуулж, худалдан авагчийн хувийн мэдээллийг ил болгодоггүй.

## 2. Хэрэглэгчийн төрөл

| Эрх | Боломж |
|---|---|
| **Зочин** | Цүнх үзэх, хайх, шүүх, гэрчилгээ шалгах, тусламжийн хүсэлт илгээх |
| **Хэрэглэгч** | Дээрх бүгд + сагс, хадгалах, захиалах, төлбөр төлөх, захиалгын түүх, гэрчилгээ, өөрийн хүсэлтүүдийг харах, имэйл/утсаа кодоор баталгаажуулж солих |
| **Администратор** | Дээрх бүгд + бүтээгдэхүүн, ангилал, цуглуулга, захиалга, хэрэглэгч, төлбөр, статистик, тусламжийн хүсэлт |

## 3. Хэрэглэгчийн урсгал

```mermaid
flowchart TD
  A[Нүүр хуудас] --> B[Дэлгүүр: хайх, шүүх, эрэмбэлэх]
  B --> C[Цүнхний дэлгэрэнгүй]
  C --> D{Нэвтэрсэн үү?}
  D -- Үгүй --> E[Нэвтрэх / Бүртгүүлэх]
  E --> C
  D -- Тийм --> F[Сагс]
  F --> G[Хүргэлтийн мэдээлэл]
  G --> H[Stripe төлбөрийн хуудас]
  H --> I[Захиалга: Хүлээгдэж буй]
  I -- webhook --> J[Захиалга: Төлөгдсөн + гэрчилгээ]
  J --> K[Хүргэлтэд гарсан]
  K --> L[Хүргэгдсэн]
  J --> M[Гэрчилгээг /verify-оор шалгах]
```

**Тусламж:** зочин ч `/help` хуудсаас хүсэлт илгээнэ → админ «Тусламж» хэсгээс харж, имэйлээр хариулаад «Шийдвэрлэсэн» болгоно.

**Имэйл, утас солих:**

```mermaid
flowchart TD
  P[Миний бүртгэл] --> Q{Юуг солих вэ?}
  Q -- Имэйл --> R[Шинэ имэйл оруулах]
  R --> S[Хуучин, шинэ хаяг руу тус бүр код]
  S --> T[Хоёр кодыг оруулах] --> U[Имэйл солигдлоо]
  Q -- Утас --> V[Шинэ дугаар оруулах]
  V --> W[Бүртгэлийн имэйл рүү код]
  W --> X[Код оруулах: шинэ session нээгдэнэ]
  X --> Y[update_my_phone: session 10 минутаас шинэ эсэхийг шалгана] --> Z[Утас солигдлоо]
```

Код бүхий имэйлд мөн холбоос байдаг. Холбоосыг дарахад ч адилхан баталгаажна.

**Wireframe:** үндсэн хуудсуудын 13 хуудас бүхий wireframe: [wireframes/wireframes.pdf](wireframes/wireframes.pdf). Тусламжийн төв болон имэйл/утас солих дэлгэц нь wireframe-ийн дараа нэмэгдсэн.

## 4. Архитектур

```mermaid
flowchart LR
  B[React апп<br/>Vercel] -- anon түлхүүр + JWT --> S[(Supabase<br/>PostgreSQL + RLS)]
  B -- create-checkout --> F1[Edge Function]
  F1 -- service_role --> S
  F1 -- нууц түлхүүр --> ST[Stripe]
  B -- чиглүүлэх --> ST
  ST -- гарын үсэгтэй webhook --> F2[Edge Function<br/>stripe-webhook]
  F2 -- service_role --> S
```

## 5. ERD

13 хүснэгттэй. 1:N болон N:M холбоог хоёуланг нь ашигласан. Зураг хэлбэрээр: [erd.png](erd.png).

```mermaid
erDiagram
  profiles |o--o{ support_requests : "1:N, зочинд хоосон"
  profiles ||--o{ orders : "1:N"
  profiles ||--o{ cart_items : "1:N"
  profiles ||--o{ wishlist_items : "1:N"
  categories ||--o{ products : "1:N"
  products ||--o{ product_images : "1:N"
  products ||--o{ product_collections : "1:N"
  collections ||--o{ product_collections : "1:N"
  products ||--o{ cart_items : "1:N"
  products ||--o{ wishlist_items : "1:N"
  products ||--o{ order_items : "1:N"
  orders ||--o{ order_items : "1:N"
  orders ||--o{ payments : "1:N"
  order_items ||--o{ certificates : "1:N"

  profiles {
    uuid id PK "auth.users руу FK"
    text email
    text full_name
    text phone
    text role "customer эсвэл admin"
    timestamptz created_at
  }
  categories {
    bigint id PK
    text name UK
    text slug UK
    timestamptz created_at
  }
  collections {
    bigint id PK
    text name UK
    text slug UK
    timestamptz created_at
  }
  products {
    bigint id PK
    bigint category_id FK
    text name
    text slug UK
    text description
    text material
    text color
    text dimensions
    numeric price
    int stock
    boolean is_active
    timestamptz created_at
  }
  product_images {
    bigint id PK
    bigint product_id FK
    text url
    text storage_path
    int position
  }
  product_collections {
    bigint product_id PK,FK
    bigint collection_id PK,FK
  }
  cart_items {
    uuid user_id PK,FK
    bigint product_id PK,FK
    int quantity
    timestamptz created_at
  }
  wishlist_items {
    uuid user_id PK,FK
    bigint product_id PK,FK
    timestamptz created_at
  }
  orders {
    uuid id PK
    uuid user_id FK
    text status
    numeric total
    text shipping_name
    text shipping_phone
    text shipping_city
    text shipping_address
    text note
    text stripe_session_id UK
    timestamptz created_at
    timestamptz paid_at
  }
  order_items {
    bigint id PK
    uuid order_id FK
    bigint product_id FK
    text product_name "худалдан авах үеийн нэр"
    numeric unit_price "худалдан авах үеийн үнэ"
    int quantity
  }
  payments {
    bigint id PK
    uuid order_id FK
    text provider
    text provider_ref UK
    numeric amount
    text currency
    text status
    timestamptz created_at
  }
  certificates {
    bigint id PK
    bigint order_item_id FK
    text serial UK
    timestamptz issued_at
  }
  support_requests {
    bigint id PK
    uuid user_id FK "зочин бол хоосон"
    text name
    text email
    text topic "order, product, certificate, payment, other"
    text message
    text status "open эсвэл closed"
    timestamptz created_at
  }
```

**N:M холбоо:** `products ↔ collections` (`product_collections`-оор), `profiles ↔ products` (`cart_items`, `wishlist_items`-ээр), `orders ↔ products` (`order_items`-ээр).

## 6. RLS бодлого

| Хүснэгт | Унших | Бичих |
|---|---|---|
| `categories`, `collections`, `product_images`, `product_collections` | Бүгд | Зөвхөн админ |
| `products` | Идэвхтэйг нь бүгд, нуугдсаныг зөвхөн админ | Зөвхөн админ |
| `profiles` | Өөрийнх эсвэл админ | Зөвхөн өөрийн нэр. Утсыг зөвхөн `update_my_phone()` функцээр, кодоор баталгаажуулсны дараа. `role` баганыг шууд өөрчлөх эрх хэнд ч алга |
| `support_requests` | Өөрийнх эсвэл админ (зочин уншиж чадахгүй) | Хэн ч өөрийн нэрээр илгээнэ, нэг имэйлээс цагт 5 хүртэл. Төлөвийг зөвхөн админ өөрчилнө |
| `cart_items`, `wishlist_items` | Өөрийнх | Өөрийнх |
| `orders`, `order_items`, `payments`, `certificates` | Өөрийнх эсвэл админ | Browser-оос бичих эрхгүй. Зөвхөн SQL функцээр |
| Storage `product-images` | Бүгд | Зөвхөн админ, 5 MB, JPG/PNG/WEBP |

Яагаад `orders` руу шууд бичиж болдоггүй вэ? Хэрэв боломжтой бол хэрэглэгч browser-ийн консолоос `status = 'paid'` болгож, үнэгүй цүнх авах байсан.

## 7. Төлбөрийн урсгал

```mermaid
sequenceDiagram
  actor U as Хэрэглэгч
  participant R as React
  participant C as create-checkout
  participant D as PostgreSQL
  participant S as Stripe
  participant W as stripe-webhook

  U->>R: «Төлбөр төлөх»
  R->>C: JWT + хүргэлтийн мэдээлэл
  C->>D: create_order_from_cart()
  Note over D: Үнийг DB-ээс уншина.<br/>Үлдэгдлийг хасаж нөөцөлнө.<br/>Төлөв: pending
  C->>S: Checkout session үүсгэх
  S-->>C: session id, url
  C->>D: session id-г хадгална
  C-->>R: url
  R->>S: Төлбөрийн хуудас руу шилжинэ
  U->>S: Картаар төлнө
  S-->>R: /orders/:id?paid=1 руу буцаана
  Note over R: Энэ нь төлбөрийн баталгаа биш.<br/>DB-ээс төлөвийг 3 секунд тутам шалгана.
  S->>W: checkout.session.completed (гарын үсэгтэй)
  W->>W: Гарын үсгийг шалгана
  W->>D: mark_order_paid()
  Note over D: pending → paid<br/>payments мөр нэмнэ<br/>гэрчилгээ үүсгэнэ
  D-->>R: Дараагийн шалгалтаар paid
  R-->>U: «Төлбөр баталгаажлаа!» + сериал дугаар
```

### Онцгой тохиолдлууд

| Тохиолдол | Шийдэл |
|---|---|
| Сүүлийн цүнхийг хоёр хүн зэрэг захиалах | `FOR UPDATE` мөрийг түгжинэ. Нэг нь амжилттай, нөгөө нь «үлдэгдэл хүрэлцэхгүй» мэдэгдэл авна |
| Төлбөр төлөхгүй орхих | Session 31 минутын дараа дуусч, webhook захиалгыг цуцлан үлдэгдэл болон сагсыг сэргээнэ |
| Stripe ажиллахгүй байх | Захиалга цуцлагдаж, үлдэгдэл болон сагс сэргээгдэнэ |
| Stripe нэг webhook-ийг хоёр удаа илгээх | Төлөв аль хэдийн paid бол `already_paid` буцаана. Давхар төлбөр, гэрчилгээ үүсэхгүй |
| Хуурамч webhook | Гарын үсэг таарахгүй бол 400, юу ч өөрчлөгдөхгүй |
| Цуцлагдсан захиалгад төлбөр орох | `needs_refund` төлөвтэй бүртгэгдэж, админы «Төлбөр» хуудсанд харагдана. Буцаалтыг Stripe дээр гараар хийнэ |
| Webhook түр алдаа | 500 буцааж, Stripe дахин илгээнэ. SQL функцууд давтахад аюулгүй |

## 8. Захиалгын төлөв

```mermaid
stateDiagram-v2
  [*] --> pending: Захиалга үүсэх
  pending --> paid: Webhook (зөвхөн)
  pending --> cancelled: Хугацаа дуусах эсвэл админ цуцлах
  paid --> shipped: Админ
  shipped --> delivered: Админ
  delivered --> [*]
  cancelled --> [*]
```

## 9. Дизайн систем

| Зүйл | Сонголт |
|---|---|
| Хэв шинж | «Чимээгүй тансаг»: цагаан дэвсгэр, том кампанит зураг, бичлэг, дөрвөлжин ирмэг. Нүүр хуудас нь загварын ордны цуглуулгын хуудас шиг: бүтээгдэхүүний тор дунд том зураг орно |
| Өнгө | Цагаан `#ffffff`, элсэн саарал `#f6f5f3`, бэх хар `#19110b`, алт `#b08d57` |
| Гарчиг | Manrope, нимгэн жин. Брэндийн нэр ERDENE нь Cormorant Garamond |
| Эх бичвэр | Manrope (кирилл үсэгтэй) |

Бүх утгыг `src/index.css` доторх `@theme` хэсэгт нэг дор тодорхойлсон.

## 10. Эх сурвалж ба зөвшөөрөл

- Цүнхний зураг, кампанит бичлэг (`public/media`): Google Gemini-ээр үүсгэсэн, лого, бичиггүй.
- Зураггүй цүнхний зураг: энэ төсөлд `scripts/generate-bag-art.mjs` скриптээр зурсан анхны зураг.
- Фонтууд: Cormorant Garamond, Manrope (SIL Open Font License, Fontsource-оор).
- Брэндийн нэр, лого: зохиомол. Бодит тансаг брэндийн лого, зураг, загвар ашиглаагүй.
