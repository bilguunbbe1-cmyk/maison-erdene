-- Maison Erdene · 0001: tables and relationships
--
-- Relationships (see docs/DESIGN.md for the ERD):
--   1:N  categories -> products, products -> product_images, profiles -> orders,
--        orders -> order_items, orders -> payments, order_items -> certificates
--   N:M  products <-> collections (product_collections)
--        profiles <-> products    (cart_items, wishlist_items)

-- One row per signed-up user. Extends Supabase's auth.users with app data.
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  full_name   text not null default '',
  phone       text not null default '',
  role        text not null default 'customer' check (role in ('customer', 'admin')),
  created_at  timestamptz not null default now()
);

create table public.categories (
  id          bigint generated always as identity primary key,
  name        text not null unique check (length(trim(name)) > 0),
  slug        text not null unique check (slug ~ '^[a-z0-9-]+$'),
  created_at  timestamptz not null default now()
);

create table public.collections (
  id          bigint generated always as identity primary key,
  name        text not null unique check (length(trim(name)) > 0),
  slug        text not null unique check (slug ~ '^[a-z0-9-]+$'),
  created_at  timestamptz not null default now()
);

create table public.products (
  id           bigint generated always as identity primary key,
  -- RESTRICT: a category that still has bags cannot be deleted by accident.
  category_id  bigint not null references public.categories (id) on delete restrict,
  name         text not null check (length(trim(name)) > 0),
  slug         text not null unique check (slug ~ '^[a-z0-9-]+$'),
  description  text not null default '',
  material     text not null default '',
  color        text not null default '',
  dimensions   text not null default '',
  price        numeric(10, 2) not null check (price > 0),
  stock        integer not null default 0 check (stock >= 0),
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

create index products_category_idx on public.products (category_id);
create index products_created_idx on public.products (created_at desc);

create table public.product_images (
  id            bigint generated always as identity primary key,
  product_id    bigint not null references public.products (id) on delete cascade,
  url           text not null,
  -- Path inside the Storage bucket. NULL for the bundled seed artwork.
  storage_path  text,
  position      integer not null default 0
);

create index product_images_product_idx on public.product_images (product_id, position);

-- N:M link table: a bag can belong to several collections.
create table public.product_collections (
  product_id     bigint not null references public.products (id) on delete cascade,
  collection_id  bigint not null references public.collections (id) on delete cascade,
  primary key (product_id, collection_id)
);

create table public.cart_items (
  user_id     uuid not null references public.profiles (id) on delete cascade,
  product_id  bigint not null references public.products (id) on delete cascade,
  quantity    integer not null default 1 check (quantity between 1 and 10),
  created_at  timestamptz not null default now(),
  primary key (user_id, product_id)
);

create table public.wishlist_items (
  user_id     uuid not null references public.profiles (id) on delete cascade,
  product_id  bigint not null references public.products (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, product_id)
);

create table public.orders (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.profiles (id) on delete restrict,
  status             text not null default 'pending'
                     check (status in ('pending', 'paid', 'shipped', 'delivered', 'cancelled')),
  total              numeric(12, 2) not null check (total >= 0),
  shipping_name      text not null,
  shipping_phone     text not null,
  shipping_city      text not null,
  shipping_address   text not null,
  note               text not null default '',
  stripe_session_id  text unique,
  created_at         timestamptz not null default now(),
  paid_at            timestamptz
);

create index orders_user_idx on public.orders (user_id, created_at desc);
create index orders_status_idx on public.orders (status);

create table public.order_items (
  id            bigint generated always as identity primary key,
  order_id      uuid not null references public.orders (id) on delete cascade,
  -- RESTRICT keeps order history intact: sold bags can be hidden, not deleted.
  product_id    bigint not null references public.products (id) on delete restrict,
  -- Copied at purchase time so later price or name edits do not rewrite history.
  product_name  text not null,
  unit_price    numeric(10, 2) not null check (unit_price >= 0),
  quantity      integer not null check (quantity > 0)
);

create index order_items_order_idx on public.order_items (order_id);

-- Written only by the Stripe webhook. provider_ref is unique so a webhook that
-- Stripe delivers twice cannot record the same payment twice.
create table public.payments (
  id            bigint generated always as identity primary key,
  order_id      uuid not null references public.orders (id) on delete restrict,
  provider      text not null default 'stripe',
  provider_ref  text not null unique,
  amount        numeric(12, 2) not null,
  currency      text not null default 'usd',
  status        text not null check (status in ('succeeded', 'needs_refund')),
  created_at    timestamptz not null default now()
);

create index payments_order_idx on public.payments (order_id);

-- The feature that sets this shop apart: every bag sold gets a serial number
-- that anyone can check on the public /verify page.
create table public.certificates (
  id             bigint generated always as identity primary key,
  order_item_id  bigint not null references public.order_items (id) on delete restrict,
  serial         text not null unique,
  issued_at      timestamptz not null default now()
);

create index certificates_item_idx on public.certificates (order_item_id);

-- Create the profile automatically whenever someone signs up.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, phone)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
