import { useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useCart } from '../../context/CartContext.jsx'
import { ProductImage } from '../../components/ProductCard.jsx'
import { ConfirmDialog, EmptyState, ErrorState, PageLoader } from '../../components/ui.jsx'
import { formatPrice } from '../../lib/format.js'

// A cart row is a problem when the bag was hidden or stock fell since it was added.
export const isUnavailable = (item) =>
  !item.product || !item.product.is_active || item.product.stock < item.quantity

export default function Cart() {
  const { items, total, loading, error, refresh, setQuantity, removeItem, MAX_PER_ITEM } = useCart()
  const [toRemove, setToRemove] = useState(null)
  const [busy, setBusy] = useState(false)

  const changeQuantity = async (item, quantity) => {
    setBusy(true)
    try {
      await setQuantity(item.product_id, quantity)
    } catch {
      toast.error('Тоог өөрчилж чадсангүй.')
    } finally {
      setBusy(false)
    }
  }

  const confirmRemove = async () => {
    setBusy(true)
    try {
      await removeItem(toRemove.product_id)
      toast.success('Сагснаас хасагдлаа')
    } catch {
      toast.error('Хасаж чадсангүй.')
    } finally {
      setBusy(false)
      setToRemove(null)
    }
  }

  if (loading && items.length === 0) return <PageLoader />
  if (error) return <ErrorState onRetry={refresh} />
  if (items.length === 0) {
    return (
      <EmptyState
        title="Таны сагс хоосон байна"
        text="Цуглуулгаас өөрт тохирох цүнхээ сонгоорой."
        action={{ to: '/shop', label: 'Дэлгүүр үзэх' }}
      />
    )
  }

  const blocked = items.some(isUnavailable)

  return (
    <div className="container-page py-12">
      <h1 className="text-3xl sm:text-4xl">Сагс</h1>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_360px]">
        <ul className="divide-y divide-line border-y border-line">
          {items.map((item) => (
            <li key={item.product_id} className="flex gap-4 py-5 sm:gap-6">
              {item.product ? (
                <>
                  <Link to={`/products/${item.product.slug}`} className="w-24 shrink-0 bg-sand sm:w-32">
                    <ProductImage product={item.product} />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Link to={`/products/${item.product.slug}`} className="text-base leading-snug">{item.product.name}</Link>
                        <p className="mt-1 text-xs text-ash">{item.product.color}</p>
                      </div>
                      <p className="text-sm whitespace-nowrap">{formatPrice(item.product.price * item.quantity)}</p>
                    </div>
                    {isUnavailable(item) && (
                      <p className="mt-2 text-xs text-danger" role="alert">
                        Үлдэгдэл хүрэлцэхгүй байна{item.product.stock > 0 ? ` (${item.product.stock} ширхэг үлдсэн)` : ''}.
                      </p>
                    )}
                    <div className="mt-auto flex items-center justify-between gap-3 pt-3">
                      <div className="flex items-center border border-line">
                        <button type="button" className="size-9 cursor-pointer disabled:opacity-30" aria-label="Тоог хасах" disabled={busy || item.quantity <= 1} onClick={() => changeQuantity(item, item.quantity - 1)}>−</button>
                        <span className="w-8 text-center text-sm" aria-live="polite">{item.quantity}</span>
                        <button type="button" className="size-9 cursor-pointer disabled:opacity-30" aria-label="Тоог нэмэх" disabled={busy || item.quantity >= Math.min(item.product.stock, MAX_PER_ITEM)} onClick={() => changeQuantity(item, item.quantity + 1)}>+</button>
                      </div>
                      <button type="button" className="link text-xs text-ash" onClick={() => setToRemove(item)}>Хасах</button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-1 items-center justify-between gap-3">
                  <p className="text-sm text-danger" role="alert">Энэ бүтээгдэхүүн зарагдахаа больсон.</p>
                  <button type="button" className="link text-xs text-ash" onClick={() => setToRemove(item)}>Хасах</button>
                </div>
              )}
            </li>
          ))}
        </ul>

        <aside className="self-start border border-line p-7 lg:sticky lg:top-28">
          <div className="flex justify-between text-sm">
            <span className="text-ash">Дүн</span>
            <span>{formatPrice(total)}</span>
          </div>
          <div className="mt-3 flex justify-between text-sm">
            <span className="text-ash">Хүргэлт</span>
            <span>Үнэгүй</span>
          </div>
          <div className="mt-5 flex items-baseline justify-between border-t border-line pt-5">
            <span className="text-sm">Нийт</span>
            <span className="text-2xl font-light">{formatPrice(total)}</span>
          </div>
          {blocked ? (
            <p className="mt-6 text-xs text-danger" role="alert">Төлбөр хийхийн өмнө сагсаа засна уу.</p>
          ) : (
            <Link to="/checkout" className="btn-primary mt-6 w-full">Захиалга үргэлжлүүлэх</Link>
          )}
        </aside>
      </div>

      <ConfirmDialog
        open={Boolean(toRemove)}
        title="Сагснаас хасах уу?"
        text={toRemove?.product?.name}
        confirmLabel="Хасах"
        busy={busy}
        onConfirm={confirmRemove}
        onCancel={() => setToRemove(null)}
      />
    </div>
  )
}
