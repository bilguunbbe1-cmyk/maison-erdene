-- Maison Erdene · 0003: business logic that must not be trusted to the browser
--
-- Each function runs as one transaction, so a failure part-way leaves nothing
-- half done. Supabase lets anon and authenticated execute new public functions by
-- default, so every function below revokes that and grants only what it needs.

-- ---------------------------------------------------------------------------
-- Called by a signed-in customer (through the create-checkout Edge Function)
-- ---------------------------------------------------------------------------

-- Turns the cart into a pending order and reserves the stock. Prices come from
-- the products table, never from the client, so they cannot be tampered with.
create function public.create_order_from_cart(
  p_name text,
  p_phone text,
  p_city text,
  p_address text,
  p_note text default ''
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_order uuid;
  v_total numeric(12, 2) := 0;
  v_row record;
begin
  if v_user is null then
    raise exception 'Нэвтэрсэн байх шаардлагатай.';
  end if;

  if length(trim(coalesce(p_name, ''))) = 0
     or length(trim(coalesce(p_phone, ''))) = 0
     or length(trim(coalesce(p_city, ''))) = 0
     or length(trim(coalesce(p_address, ''))) = 0 then
    raise exception 'Хүргэлтийн мэдээлэл дутуу байна.';
  end if;

  insert into public.orders
    (user_id, total, shipping_name, shipping_phone, shipping_city, shipping_address, note)
  values
    (v_user, 0, trim(p_name), trim(p_phone), trim(p_city), trim(p_address), coalesce(trim(p_note), ''))
  returning id into v_order;

  -- FOR UPDATE locks the product rows, so two people buying the last bag at the
  -- same moment are processed one after the other and only one succeeds.
  for v_row in
    select c.product_id, c.quantity, p.name, p.price, p.stock, p.is_active
    from public.cart_items c
    join public.products p on p.id = c.product_id
    where c.user_id = v_user
    order by c.product_id
    for update of p
  loop
    if not v_row.is_active or v_row.stock < v_row.quantity then
      raise exception '«%» бүтээгдэхүүний үлдэгдэл хүрэлцэхгүй байна.', v_row.name;
    end if;

    insert into public.order_items (order_id, product_id, product_name, unit_price, quantity)
    values (v_order, v_row.product_id, v_row.name, v_row.price, v_row.quantity);

    update public.products
    set stock = stock - v_row.quantity
    where id = v_row.product_id;

    v_total := v_total + v_row.price * v_row.quantity;
  end loop;

  if v_total = 0 then
    raise exception 'Таны сагс хоосон байна.';
  end if;

  update public.orders set total = v_total where id = v_order;
  delete from public.cart_items where user_id = v_user;

  return v_order;
end;
$$;

revoke execute on function public.create_order_from_cart(text, text, text, text, text)
  from public, anon;
grant execute on function public.create_order_from_cart(text, text, text, text, text)
  to authenticated;

-- ---------------------------------------------------------------------------
-- Called only by the Edge Functions, using the service_role key
-- ---------------------------------------------------------------------------

-- Pending -> cancelled, and the reserved stock goes back on sale. Used when a
-- Checkout session expires, and when creating the session fails (in which case
-- the bags also go back in the customer's cart).
create function public.cancel_pending_order(p_order uuid, p_restore_cart boolean default false)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid;
begin
  update public.orders
  set status = 'cancelled'
  where id = p_order and status = 'pending'
  returning user_id into v_user;

  -- Not pending any more (already paid or cancelled): nothing to undo.
  if v_user is null then
    return false;
  end if;

  update public.products p
  set stock = p.stock + i.quantity
  from public.order_items i
  where i.order_id = p_order and i.product_id = p.id;

  if p_restore_cart then
    insert into public.cart_items (user_id, product_id, quantity)
    select v_user, i.product_id, i.quantity
    from public.order_items i
    where i.order_id = p_order
    on conflict (user_id, product_id) do nothing;
  end if;

  return true;
end;
$$;

revoke execute on function public.cancel_pending_order(uuid, boolean)
  from public, anon, authenticated;
grant execute on function public.cancel_pending_order(uuid, boolean) to service_role;

-- Pending -> paid, called from the webhook. Stripe may deliver the same event
-- more than once, so a repeat call has to be harmless.
create function public.mark_order_paid(p_session text, p_amount numeric, p_currency text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders;
  v_item record;
begin
  select * into v_order
  from public.orders
  where stripe_session_id = p_session
  for update;

  if not found then
    raise exception 'No order for session %', p_session;
  end if;

  if v_order.status in ('paid', 'shipped', 'delivered') then
    return 'already_paid';
  end if;

  -- The customer paid for an order the shop already cancelled. Keep a record
  -- so the admin sees it on the payments page and can refund it in Stripe.
  if v_order.status = 'cancelled' then
    insert into public.payments (order_id, provider_ref, amount, currency, status)
    values (v_order.id, p_session, p_amount, p_currency, 'needs_refund')
    on conflict (provider_ref) do nothing;
    return 'needs_refund';
  end if;

  update public.orders set status = 'paid', paid_at = now() where id = v_order.id;

  insert into public.payments (order_id, provider_ref, amount, currency, status)
  values (v_order.id, p_session, p_amount, p_currency, 'succeeded');

  -- One certificate per physical bag, so quantity 2 gets two serial numbers.
  for v_item in
    select id, quantity from public.order_items where order_id = v_order.id
  loop
    insert into public.certificates (order_item_id, serial)
    select v_item.id,
           'ME-' || to_char(now(), 'YYYY') || '-' ||
           upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))
    from generate_series(1, v_item.quantity);
  end loop;

  return 'paid';
end;
$$;

revoke execute on function public.mark_order_paid(text, numeric, text)
  from public, anon, authenticated;
grant execute on function public.mark_order_paid(text, numeric, text) to service_role;

-- ---------------------------------------------------------------------------
-- Public
-- ---------------------------------------------------------------------------

-- Authenticity check. Exposes the bag only, never who bought it.
create function public.verify_certificate(p_serial text)
returns table (serial text, product_name text, product_slug text, image_url text, issued_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select c.serial,
         i.product_name,
         p.slug,
         (select pi.url from public.product_images pi
          where pi.product_id = p.id order by pi.position limit 1),
         c.issued_at
  from public.certificates c
  join public.order_items i on i.id = c.order_item_id
  join public.products p on p.id = i.product_id
  where c.serial = upper(trim(p_serial));
$$;

revoke execute on function public.verify_certificate(text) from public;
grant execute on function public.verify_certificate(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Admin only. Each function checks is_admin() itself, because SECURITY DEFINER
-- bypasses RLS.
-- ---------------------------------------------------------------------------

-- Only these moves are allowed. "paid" is deliberately absent as a target: only
-- the webhook can mark an order paid. Cancelling a paid order needs a refund in
-- Stripe first, which is outside this function.
create function public.admin_set_order_status(p_order uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_current text;
begin
  if not public.is_admin() then
    raise exception 'Зөвхөн админ хийх боломжтой.';
  end if;

  select status into v_current from public.orders where id = p_order for update;

  if v_current is null then
    raise exception 'Захиалга олдсонгүй.';
  end if;

  if v_current = 'pending' and p_status = 'cancelled' then
    perform public.cancel_pending_order(p_order);
  elsif (v_current = 'paid' and p_status = 'shipped')
     or (v_current = 'shipped' and p_status = 'delivered') then
    update public.orders set status = p_status where id = p_order;
  else
    raise exception 'Энэ төлөвийн шилжилт хийх боломжгүй.';
  end if;
end;
$$;

revoke execute on function public.admin_set_order_status(uuid, text) from public, anon;
grant execute on function public.admin_set_order_status(uuid, text) to authenticated;

create function public.admin_set_user_role(p_user uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Зөвхөн админ хийх боломжтой.';
  end if;
  if p_user = auth.uid() then
    raise exception 'Өөрийн эрхийг өөрчлөх боломжгүй.';
  end if;
  if p_role not in ('customer', 'admin') then
    raise exception 'Эрх буруу байна.';
  end if;

  update public.profiles set role = p_role where id = p_user;
end;
$$;

revoke execute on function public.admin_set_user_role(uuid, text) from public, anon;
grant execute on function public.admin_set_user_role(uuid, text) to authenticated;

-- All dashboard numbers in one call. Revenue counts only orders that were paid.
create function public.admin_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
begin
  if not public.is_admin() then
    raise exception 'Зөвхөн админ хийх боломжтой.';
  end if;

  select jsonb_build_object(
    'revenue', (select coalesce(sum(total), 0) from public.orders
                where status in ('paid', 'shipped', 'delivered')),
    'order_count', (select count(*) from public.orders),
    'paid_count', (select count(*) from public.orders
                   where status in ('paid', 'shipped', 'delivered')),
    'customer_count', (select count(*) from public.profiles where role = 'customer'),
    'low_stock', (select count(*) from public.products where is_active and stock <= 1),
    'revenue_by_day', (
      select jsonb_agg(jsonb_build_object('day', d.day, 'revenue', d.revenue) order by d.sort_day)
      from (
        select to_char(g.day, 'MM-DD') as day, g.day as sort_day,
               coalesce(sum(o.total), 0) as revenue
        from generate_series(current_date - 29, current_date, interval '1 day') as g(day)
        left join public.orders o
          on o.paid_at >= g.day and o.paid_at < g.day + interval '1 day'
         and o.status in ('paid', 'shipped', 'delivered')
        group by g.day
      ) d
    ),
    'orders_by_status', (
      select coalesce(jsonb_agg(jsonb_build_object('status', s.status, 'count', s.count)), '[]'::jsonb)
      from (select status, count(*) as count from public.orders group by status) s
    ),
    'top_products', (
      select coalesce(jsonb_agg(jsonb_build_object('name', t.name, 'sold', t.sold, 'revenue', t.revenue)), '[]'::jsonb)
      from (
        select i.product_name as name, sum(i.quantity) as sold,
               sum(i.quantity * i.unit_price) as revenue
        from public.order_items i
        join public.orders o on o.id = i.order_id
        where o.status in ('paid', 'shipped', 'delivered')
        group by i.product_name
        order by revenue desc
        limit 5
      ) t
    )
  ) into v_result;

  return v_result;
end;
$$;

revoke execute on function public.admin_stats() from public, anon;
grant execute on function public.admin_stats() to authenticated;

-- Internal trigger function: nobody should be able to call it directly.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
