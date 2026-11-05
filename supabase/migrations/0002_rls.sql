-- Maison Erdene · 0002: Row Level Security
--
-- Two layers protect every table:
--   GRANT  decides which operations a role may attempt at all.
--   POLICY decides which rows that role may touch.
-- orders, order_items, payments and certificates have no write grants. They only
-- change through the functions in 0003, so a browser cannot mark an order as paid.

-- SECURITY DEFINER lets this read profiles without triggering the profiles
-- policies, which would otherwise call is_admin() again and recurse forever.
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;

alter table public.profiles            enable row level security;
alter table public.categories          enable row level security;
alter table public.collections         enable row level security;
alter table public.products            enable row level security;
alter table public.product_images      enable row level security;
alter table public.product_collections enable row level security;
alter table public.cart_items          enable row level security;
alter table public.wishlist_items      enable row level security;
alter table public.orders              enable row level security;
alter table public.order_items         enable row level security;
alter table public.payments            enable row level security;
alter table public.certificates        enable row level security;

-- Start from nothing, then grant exactly what each role needs.
revoke all on all tables in schema public from anon, authenticated;

-- Catalogue: anyone reads, admins write.
grant select on public.categories, public.collections, public.products,
                public.product_images, public.product_collections
  to anon, authenticated;
grant insert, update, delete on public.categories, public.collections, public.products,
                public.product_images, public.product_collections
  to authenticated;

-- Profiles: only these two columns are editable, so nobody can make themselves
-- an admin by updating their own "role" column.
grant select on public.profiles to authenticated;
grant update (full_name, phone) on public.profiles to authenticated;

grant select, insert, update, delete on public.cart_items, public.wishlist_items to authenticated;

-- Read-only from the browser.
grant select on public.orders, public.order_items, public.payments, public.certificates
  to authenticated;

grant all on all tables in schema public to service_role;

-- Admin inserts use the id sequences, so they need this whatever the project's defaults are.
grant usage on all sequences in schema public to authenticated;
grant all on all sequences in schema public to service_role;

-- profiles
create policy "profiles: read own or admin" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));

create policy "profiles: update own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- categories
create policy "categories: public read" on public.categories
  for select to anon, authenticated using (true);
create policy "categories: admin insert" on public.categories
  for insert to authenticated with check ((select public.is_admin()));
create policy "categories: admin update" on public.categories
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "categories: admin delete" on public.categories
  for delete to authenticated using ((select public.is_admin()));

-- collections
create policy "collections: public read" on public.collections
  for select to anon, authenticated using (true);
create policy "collections: admin insert" on public.collections
  for insert to authenticated with check ((select public.is_admin()));
create policy "collections: admin update" on public.collections
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "collections: admin delete" on public.collections
  for delete to authenticated using ((select public.is_admin()));

-- products: hidden bags are visible to admins only
create policy "products: public read active" on public.products
  for select to anon, authenticated
  using (is_active or (select public.is_admin()));
create policy "products: admin insert" on public.products
  for insert to authenticated with check ((select public.is_admin()));
create policy "products: admin update" on public.products
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "products: admin delete" on public.products
  for delete to authenticated using ((select public.is_admin()));

-- product_images
create policy "product_images: public read" on public.product_images
  for select to anon, authenticated using (true);
create policy "product_images: admin insert" on public.product_images
  for insert to authenticated with check ((select public.is_admin()));
create policy "product_images: admin update" on public.product_images
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "product_images: admin delete" on public.product_images
  for delete to authenticated using ((select public.is_admin()));

-- product_collections
create policy "product_collections: public read" on public.product_collections
  for select to anon, authenticated using (true);
create policy "product_collections: admin insert" on public.product_collections
  for insert to authenticated with check ((select public.is_admin()));
create policy "product_collections: admin update" on public.product_collections
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "product_collections: admin delete" on public.product_collections
  for delete to authenticated using ((select public.is_admin()));

-- cart_items and wishlist_items: each user sees and changes only their own rows
create policy "cart_items: own rows" on public.cart_items
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "wishlist_items: own rows" on public.wishlist_items
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- orders and everything hanging off them: owner or admin, read only
create policy "orders: read own or admin" on public.orders
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

create policy "order_items: read own or admin" on public.order_items
  for select to authenticated
  using (
    (select public.is_admin())
    or exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = (select auth.uid())
    )
  );

create policy "payments: read own or admin" on public.payments
  for select to authenticated
  using (
    (select public.is_admin())
    or exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = (select auth.uid())
    )
  );

create policy "certificates: read own or admin" on public.certificates
  for select to authenticated
  using (
    (select public.is_admin())
    or exists (
      select 1
      from public.order_items i
      join public.orders o on o.id = i.order_id
      where i.id = order_item_id and o.user_id = (select auth.uid())
    )
  );

-- Storage: public bucket with a 5 MB limit and image types only, enforced by
-- Supabase itself in addition to the check in the admin form.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880,
        array['image/jpeg', 'image/png', 'image/webp']);

create policy "product-images: public read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'product-images');
create policy "product-images: admin upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'product-images' and (select public.is_admin()));
create policy "product-images: admin update" on storage.objects
  for update to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()));
create policy "product-images: admin delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()));
