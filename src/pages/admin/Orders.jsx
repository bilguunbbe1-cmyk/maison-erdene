import { useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { supabase, unwrap } from '../../lib/supabase.js'
import { useFetch } from '../../hooks/useFetch.js'
import { ConfirmDialog, EmptyState, ErrorState, PageLoader, Pagination, StatusBadge } from '../../components/ui.jsx'
import { formatDate, formatPrice, ORDER_STATUS } from '../../lib/format.js'

const PAGE_SIZE = 10

// The next step an admin can take from each status. There is no way to set "paid"
// here: only the Stripe webhook can do that. The SQL function enforces this too.
const NEXT_ACTION = {
  pending: { status: 'cancelled', label: 'Цуцлах', confirm: 'Захиалга цуцлагдаж, цүнх дахин зарагдахаар нээгдэнэ.' },
  paid: { status: 'shipped', label: 'Хүргэлтэд гаргах', confirm: 'Захиалгыг хүргэлтэд гарсан болгох уу?' },
  shipped: { status: 'delivered', label: 'Хүргэгдсэн', confirm: 'Захиалгыг хүргэгдсэн болгох уу?' },
}

export default function Orders() {
  const [status, setStatus] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)
  const [pending, setPending] = useState(null) // { order, action } waiting for confirmation
  const [busy, setBusy] = useState(false)

  const { data, loading, error, reload } = useFetch(() => {
    let query = supabase
      .from('orders')
      .select('id, status, total, created_at, shipping_name, shipping_phone, profile:profiles(email)', { count: 'exact' })
    if (status) query = query.eq('status', status)
    if (from) query = query.gte('created_at', new Date(`${from}T00:00:00`).toISOString())
    // End of the chosen day, so the "to" date includes that whole day.
    if (to) query = query.lte('created_at', new Date(`${to}T23:59:59.999`).toISOString())
    const start = (page - 1) * PAGE_SIZE
    return unwrap(query.order('created_at', { ascending: false }).range(start, start + PAGE_SIZE - 1))
  }, [status, from, to, page])

  const confirmAction = async () => {
    setBusy(true)
    try {
      await unwrap(
        supabase.rpc('admin_set_order_status', {
          p_order: pending.order.id,
          p_status: pending.action.status,
        }),
      )
      toast.success('Төлөв шинэчлэгдлээ')
      reload()
    } catch (actionError) {
      toast.error(actionError.message)
    } finally {
      setBusy(false)
      setPending(null)
    }
  }

  const orders = data?.data ?? []

  return (
    <>
      <h1 className="text-4xl">Захиалга</h1>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <select className="input w-auto" aria-label="Төлөв" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }}>
          <option value="">Бүх төлөв</option>
          {Object.entries(ORDER_STATUS).map(([key, config]) => (
            <option key={key} value={key}>{config.label}</option>
          ))}
        </select>
        <input type="date" className="input w-auto" aria-label="Эхлэх огноо" value={from} onChange={(event) => { setFrom(event.target.value); setPage(1) }} />
        <input type="date" className="input w-auto" aria-label="Дуусах огноо" value={to} onChange={(event) => { setTo(event.target.value); setPage(1) }} />
      </div>

      <div className="mt-6">
        {error ? (
          <ErrorState onRetry={reload} />
        ) : loading && !data ? (
          <PageLoader />
        ) : orders.length === 0 ? (
          <EmptyState title="Захиалга олдсонгүй" text="Шүүлтүүрээ өөрчилж үзнэ үү." />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-admin">
              <thead>
                <tr><th>Дугаар</th><th>Хэрэглэгч</th><th>Огноо</th><th>Дүн</th><th>Төлөв</th><th><span className="sr-only">Үйлдэл</span></th></tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const action = NEXT_ACTION[order.status]
                  return (
                    <tr key={order.id}>
                      <td><Link to={`/orders/${order.id}`} className="link">#{order.id.slice(0, 8)}</Link></td>
                      <td>
                        {order.shipping_name}
                        <span className="block text-xs text-ash">{order.profile?.email} · {order.shipping_phone}</span>
                      </td>
                      <td className="whitespace-nowrap text-ash">{formatDate(order.created_at, true)}</td>
                      <td>{formatPrice(order.total)}</td>
                      <td><StatusBadge status={order.status} /></td>
                      <td className="text-right whitespace-nowrap">
                        {action && (
                          <button type="button" className={`link text-xs ${action.status === 'cancelled' ? 'text-danger' : ''}`} onClick={() => setPending({ order, action })}>
                            {action.label}
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination page={page} pageCount={Math.ceil((data?.count ?? 0) / PAGE_SIZE)} onChange={setPage} />

      <ConfirmDialog
        open={Boolean(pending)}
        title={pending?.action.label}
        text={pending?.action.confirm}
        confirmLabel="Тийм"
        busy={busy}
        onConfirm={confirmAction}
        onCancel={() => setPending(null)}
      />
    </>
  )
}
