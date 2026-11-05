// Creates a Stripe Checkout session. Two ways to call it:
//   { shipping: {...} }  turn the signed-in user's cart into a new order, then pay
//   { orderId: "..." }   resume paying for an existing pending order
//
// Prices are read from the database, never from the request body.
// The service_role and Stripe keys live only here, as Supabase secrets.
import Stripe from 'npm:stripe@17'
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  httpClient: Stripe.createFetchHttpClient(),
})
const SITE_URL = Deno.env.get('SITE_URL')

// Stripe's minimum session lifetime is 30 minutes. When it expires, the webhook
// cancels the order and returns the reserved stock.
const SESSION_LIFETIME_SECONDS = 30 * 60 + 60

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  // This client acts as the signed-in user, so auth.uid() and RLS apply to it.
  const userClient = createClient(
    Deno.env.get('SUPABASE_URL'),
    Deno.env.get('SUPABASE_ANON_KEY'),
    { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } },
  )
  // This one bypasses RLS. It only writes what the customer must not control.
  const admin = createClient(
    Deno.env.get('SUPABASE_URL'),
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
  )

  // A server has no saved session, so the token must be passed in explicitly.
  // This call asks Supabase Auth to check it, so a forged token gets a 401.
  const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '')
  const { data: { user } } = await userClient.auth.getUser(token)
  if (!user) return json({ error: 'Нэвтэрсэн байх шаардлагатай.' }, 401)

  let body
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Хүсэлт буруу байна.' }, 400)
  }

  // Resume path: reuse the open session instead of creating a second one.
  if (body.orderId) {
    const { data: order } = await userClient
      .from('orders')
      .select('id, status, stripe_session_id')
      .eq('id', body.orderId)
      .maybeSingle()

    if (!order) return json({ error: 'Захиалга олдсонгүй.' }, 404)
    if (order.status !== 'pending' || !order.stripe_session_id) {
      return json({ error: 'Энэ захиалгын төлбөрийг төлөх боломжгүй.' }, 409)
    }

    const session = await stripe.checkout.sessions.retrieve(order.stripe_session_id)
    if (session.status !== 'open' || !session.url) {
      return json({ error: 'Төлбөрийн хугацаа дууссан байна. Шинээр захиална уу.' }, 409)
    }
    return json({ url: session.url, orderId: order.id })
  }

  // New order path. The function checks stock and reserves it in one transaction.
  const { shipping } = body
  const { data: orderId, error: orderError } = await userClient.rpc('create_order_from_cart', {
    p_name: shipping?.name,
    p_phone: shipping?.phone,
    p_city: shipping?.city,
    p_address: shipping?.address,
    p_note: shipping?.note ?? '',
  })
  if (orderError) return json({ error: orderError.message }, 400)

  try {
    const { data: items, error: itemsError } = await admin
      .from('order_items')
      .select('product_name, unit_price, quantity')
      .eq('order_id', orderId)
    if (itemsError) throw itemsError

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: user.email,
      client_reference_id: orderId,
      metadata: { order_id: orderId },
      expires_at: Math.floor(Date.now() / 1000) + SESSION_LIFETIME_SECONDS,
      line_items: items.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency: 'usd',
          // Stripe counts in cents. Math.round guards against float error.
          unit_amount: Math.round(Number(item.unit_price) * 100),
          product_data: { name: item.product_name },
        },
      })),
      success_url: `${SITE_URL}/orders/${orderId}?paid=1`,
      cancel_url: `${SITE_URL}/orders/${orderId}`,
    })

    const { error: updateError } = await admin
      .from('orders')
      .update({ stripe_session_id: session.id })
      .eq('id', orderId)
    if (updateError) throw updateError

    return json({ url: session.url, orderId })
  } catch (error) {
    // Without a session this order could never pay or expire, so undo it now:
    // stock goes back on sale and the bags go back in the cart.
    console.error('create-checkout failed', error)
    await admin.rpc('cancel_pending_order', { p_order: orderId, p_restore_cart: true })
    return json({ error: 'Төлбөрийн систем түр ажиллахгүй байна. Дахин оролдоно уу.' }, 502)
  }
})
