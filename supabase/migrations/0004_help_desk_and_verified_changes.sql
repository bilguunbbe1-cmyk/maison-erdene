-- Help desk requests, and contact details that only change after a one-time code.

-- ---------------------------------------------------------------------------
-- Help desk
-- ---------------------------------------------------------------------------

-- One message sent from the help center form. Guests can write too, so
-- user_id is optional; signed-in customers see their own requests later.
create table public.support_requests (
  id          bigint generated always as identity primary key,
  user_id     uuid references public.profiles (id) on delete set null,
  name        text not null check (length(trim(name)) between 1 and 100),
  email       text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and length(email) <= 200),
  topic       text not null check (topic in ('order', 'product', 'certificate', 'payment', 'other')),
  message     text not null check (length(trim(message)) between 10 and 2000),
  status      text not null default 'open' check (status in ('open', 'closed')),
  created_at  timestamptz not null default now()
);

create index support_requests_status_idx on public.support_requests (status, created_at desc);
create index support_requests_user_idx on public.support_requests (user_id);

alter table public.support_requests enable row level security;

-- Same approach as 0002: start from nothing, then grant exactly what is needed.
revoke all on public.support_requests from anon, authenticated;
grant all on public.support_requests to service_role;
grant usage on sequence public.support_requests_id_seq to anon, authenticated;
grant insert (user_id, name, email, topic, message) on public.support_requests to anon, authenticated;
grant select on public.support_requests to authenticated;
grant update (status) on public.support_requests to authenticated;

-- Anyone may write in, but only as themselves: guests with no user_id,
-- signed-in customers with their own id.
create policy "support: anyone can send as themselves" on public.support_requests
  for insert to anon, authenticated
  with check (user_id is not distinct from auth.uid());

create policy "support: read own or admin" on public.support_requests
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy "support: admin changes status" on public.support_requests
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- The form is open to guests, so cap how often one email address can send.
create function public.limit_support_requests()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (
    select count(*) from public.support_requests
    where lower(email) = lower(new.email) and created_at > now() - interval '1 hour'
  ) >= 5 then
    raise exception 'Хэт олон хүсэлт илгээлээ. Нэг цагийн дараа дахин оролдоно уу.';
  end if;
  return new;
end;
$$;

create trigger support_requests_rate_limit
  before insert on public.support_requests
  for each row execute function public.limit_support_requests();

revoke execute on function public.limit_support_requests() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Phone number: changes only after a one-time code
-- ---------------------------------------------------------------------------

-- The browser can no longer write the phone column directly. The only way to
-- change it is update_my_phone() below, which demands a fresh code.
revoke update (phone) on public.profiles from authenticated;

-- True when the caller's current session was opened with a one-time email
-- code (or its link) in the last 10 minutes. Supabase records how a session
-- was created in the JWT's "amr" claim, which the browser cannot forge.
create function public.signed_in_with_code_recently()
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (
    select 1
    from jsonb_array_elements(coalesce(auth.jwt() -> 'amr', '[]'::jsonb)) as entry
    where entry ->> 'method' in ('otp', 'magiclink')
      and (entry ->> 'timestamp')::bigint > extract(epoch from now() - interval '10 minutes')
  );
$$;

create function public.update_my_phone(p_phone text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Нэвтэрнэ үү.';
  end if;
  if not public.signed_in_with_code_recently() then
    raise exception 'Баталгаажуулах код шаардлагатай.';
  end if;
  if p_phone is null or p_phone !~ '^[0-9]{8}$' then
    raise exception 'Утасны дугаар 8 оронтой байна.';
  end if;

  update public.profiles set phone = p_phone where id = auth.uid();
end;
$$;

revoke execute on function public.update_my_phone(text) from public, anon;
grant execute on function public.update_my_phone(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Email: Supabase Auth changes it after codes to the old and the new address.
-- Keep the copy in profiles in step once the change is confirmed.
-- ---------------------------------------------------------------------------

create function public.sync_profile_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = coalesce(new.email, '') where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function public.sync_profile_email();

revoke execute on function public.sync_profile_email() from public, anon, authenticated;
