import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { startCheckout, supabase, unwrap } from '../../lib/supabase.js'
import { useFetch } from '../../hooks/useFetch.js'
import { EmptyState, ErrorState, PageLoader, Spinner, StatusBadge } from '../../components/ui.jsx'
import { formatDate, formatPrice, mainImage, ORDER_STATUS } from '../../lib/format.js'

const STEPS = ['pending', 'paid', 'shipped', 'delivered']
const POLL_INTERVAL_MS = 3000
const POLL_LIMIT = 40 // about two minutes

const fetchOrder = (id) =>
  unwrap(
    supabase
      .from('orders')
      .select(
        '*, order_items(id, product_name, unit_price, quantity, certificates(serial), product:products(slug, product_images(url, position)))',
      )
      .eq('id', id)
      .maybeSingle(),
  )

export default function OrderDetail() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const returnedFromStripe = params.get('paid') === '1'

  const { data: fetched, loading, error, reload } = useFetch(() => fetchOrder(id), [id])
  const [polled, setPolled] = useState(null)
  const [paying, setPaying] = useState(false)
  const order = polled ?? fetched

  // Returning from Stripe does not mean paid. Only the webhook changes the status,
  // and it can arrive a moment later, so check until the database says it changed.
  const waiting = returnedFromStripe && order?.status === 'pending'

  useEffect(() => {
    if (!waiting) return
    let attempts = 0
    const timer = setInterval(async () => {
      attempts += 1
      if (attempts > POLL_LIMIT) {
        clearInterval(timer)
        return
      }
      try {
        const latest = await fetchOrder(id)
        if (latest?.status !== 'pending') {
          setPolled(latest)
          clearInterval(timer)
          if (latest?.status === 'paid') toast.success('Төлбөр баталгаажлаа!')
        }
      } catch {
        // A failed check is not fatal: the next tick tries again.
      }
    }, POLL_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [waiting, id])

  const resumePayment = async () => {
    setPaying(true)
    try {
      window.location.assign(await startCheckout({ orderId: order.id }))
    } catch (paymentError) {
      toast.error(paymentError.message)
      setPaying(false)
      reload()
    }
  }

  if (error) return <ErrorState onRetry={reload} />
  if (loading && !order) return <PageLoader />
  if (!order) {
    return (
      <EmptyState
        title="Захиалга олдсонгүй"
        text="Энэ захиалга байхгүй эсвэл танд харах эрх алга."
        action={{ to: '/orders', label: 'Миний захиалга' }}
      />
    )
  }

  const currentStep = STEPS.indexOf(order.status)

  return (
    <div className="container-page max-w-4xl py-12">
      <Link to="/orders" className="link text-xs text-ash">← Миний захиалга</Link>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-4xl">Захиалга #{order.id.slice(0, 8)}</h1>
        <StatusBadge status={order.status} />
      </div>
      <p className="mt-2 text-xs text-ash">{formatDate(order.created_at, true)}</p>

      {order.status !== 'cancelled' && (
        <ol className="mt-8 grid grid-cols-4 gap-1.5">
          {STEPS.map((step, index) => (
            <li key={step} aria-current={index === currentStep ? 'step' : undefined}>
              <div className={`h-0.5 ${index <= currentStep ? 'bg-ink' : 'bg-line'}`} />
              <p className={`mt-2 text-[11px] leading-4 ${index <= currentStep ? 'text-ink' : 'text-ash'}`}>
                {ORDER_STATUS[step].label}
              </p>
            </li>
          ))}
        </ol>
      )}

      {waiting && (
        <div className="mt-8 flex items-center gap-3 border border-gold p-5 text-sm" role="status">
          <Spinner />
          Төлбөрийг баталгаажуулж байна. Энэ хуудас автоматаар шинэчлэгдэнэ.
        </div>
      )}

      {order.status === 'pending' && !waiting && (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border border-gold p-5">
          <p className="text-sm">Төлбөр хүлээгдэж байна. 30 минутын дотор төлөөгүй бол захиалга цуцлагдана.</p>
          <button type="button" className="btn-primary btn-sm" disabled={paying} onClick={resumePayment}>
            {paying ? 'Шилжиж байна…' : 'Төлбөр төлөх'}
          </button>
        </div>
      )}

      {order.status === 'cancelled' && (
        <p className="mt-8 border border-danger p-5 text-sm text-danger">
          Энэ захиалга цуцлагдсан тул цүнх дахин зарагдахаар нээгдсэн.
        </p>
      )}

      <section className="mt-10">
        <h2 className="text-2xl">Бүтээгдэхүүн</h2>
        <ul className="mt-4 divide-y divide-line border-y border-line">
          {order.order_items.map((item) => (
            <li key={item.id} className="flex gap-4 py-5">
              <Link to={`/products/${item.product?.slug ?? ''}`} className="w-20 shrink-0 bg-sand">
                {mainImage(item.product) && (
                  <img src={mainImage(item.product)} alt="" className="aspect-square w-full object-cover" />
                )}
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex justify-between gap-3">
                  <p className="text-base leading-snug">{item.product_name}</p>
                  <p className="text-sm whitespace-nowrap">{formatPrice(item.unit_price * item.quantity)}</p>
                </div>
                <p className="mt-1 text-xs text-ash">{item.quantity} ширхэг × {formatPrice(item.unit_price)}</p>
                {item.certificates.length > 0 && (
                  <ul className="mt-3 space-y-1">
                    {item.certificates.map((certificate) => (
                      <li key={certificate.serial} className="text-xs">
                        <span className="text-ash">Гэрчилгээ: </span>
                        <Link to={`/verify?serial=${certificate.serial}`} className="link font-medium break-all">
                          {certificate.serial}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-5 flex items-baseline justify-between">
          <span className="text-sm">Нийт</span>
          <span className="text-2xl font-light">{formatPrice(order.total)}</span>
        </div>
      </section>

      <section className="mt-10 border border-line p-6 text-sm leading-7">
        <h2 className="mb-2 text-2xl">Хүргэлт</h2>
        <p>{order.shipping_name} · {order.shipping_phone}</p>
        <p className="text-ash">{order.shipping_city}, {order.shipping_address}</p>
        {order.note && <p className="mt-1 text-ash">Тэмдэглэл: {order.note}</p>}
      </section>
    </div>
  )
}
