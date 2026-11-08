// Stripe calls this URL when something happens to a Checkout session. This is the
// only place an order can become "paid". The browser's return from Stripe proves
// nothing, because anyone can open a success URL by hand.
//
// It runs without a Supabase JWT (see supabase/config.toml), since Stripe has none.
// The Stripe signature check below is what proves the request is genuine.
import Stripe from 'npm:stripe@17'
import { createClient } from 'npm:@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  httpClient: Stripe.createFetchHttpClient(),
})
// Deno only offers asynchronous Web Crypto, hence this provider and the Async call.
const cryptoProvider = Stripe.createSubtleCryptoProvider()
const admin = createClient(
  Deno.env.get('SUPABASE_URL'),
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
)

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  if (!signature) return new Response('Missing signature', { status: 400 })

  // The signature covers the exact bytes, so read raw text and not parsed JSON.
  const payload = await req.text()

  let event
  try {
    event = await stripe.webhooks.constructEventAsync(
      payload,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET'),
      undefined,
      cryptoProvider,
    )
  } catch (error) {
    console.error('Bad webhook signature', error.message)
    return new Response('Invalid signature', { status: 400 })
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      if (session.payment_status === 'paid') {
        const { data, error } = await admin.rpc('mark_order_paid', {
          p_session: session.id,
          p_amount: session.amount_total / 100,
          p_currency: session.currency,
        })
        if (error) throw error
        console.log('Order payment result', session.id, data)
      }
    }

    if (event.type === 'checkout.session.expired') {
      // The customer left without paying. Put the stock back on sale and the
      // bags back in their cart, so they don't have to find them again.
      const session = event.data.object
      const { error } = await admin.rpc('cancel_pending_order', {
        p_order: session.metadata.order_id,
        p_restore_cart: true,
      })
      if (error) throw error
    }
  } catch (error) {
    // A non-2xx response makes Stripe retry later, which is what we want if the
    // database had a temporary problem. The SQL functions are safe to repeat.
    console.error('Webhook handling failed', error)
    return new Response('Handler error', { status: 500 })
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
