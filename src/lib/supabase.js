import { createClient } from '@supabase/supabase-js'

// The anon key is safe in the browser: RLS decides what it can do.
// The service_role key must never appear in frontend code.
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
)

// Supabase returns { data, error } instead of throwing. This unwraps that, so
// pages can use one try/catch (or useFetch) for every failure.
export async function unwrap(request) {
  const { data, error, count } = await request
  if (error) throw error
  return count === undefined || count === null ? data : { data, count }
}

// Calls the create-checkout Edge Function and returns the Stripe page URL.
export async function startCheckout(body) {
  const { data, error } = await supabase.functions.invoke('create-checkout', { body })
  if (error) {
    // Non-2xx: the function's own Mongolian message is in the response body.
    const details = await error.context?.json?.().catch(() => null)
    throw new Error(details?.error ?? 'Төлбөрийн систем түр ажиллахгүй байна.')
  }
  return data.url
}
