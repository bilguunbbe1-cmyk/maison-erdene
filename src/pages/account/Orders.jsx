import { Link } from 'react-router-dom'
import { supabase, unwrap } from '../../lib/supabase.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import { EmptyState, ErrorState, PageLoader, StatusBadge } from '../../components/ui.jsx'
import { formatDate, formatPrice } from '../../lib/format.js'

export default function Orders() {
  const { user } = useAuth()

  const { data: orders, loading, error, reload } = useFetch(
    () =>
      unwrap(
        supabase
          .from('orders')
          .select('id, status, total, created_at, order_items(product_name, quantity)')
          // Admins can read every order through RLS. This page is "my orders" only.
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
      ),
    [user.id],
  )

  if (error) return <ErrorState onRetry={reload} />
  if (loading) return <PageLoader />
  if (orders.length === 0) {
    return (
      <EmptyState
        title="Захиалга алга байна"
        text="Таны захиалгын түүх энд харагдана."
        action={{ to: '/shop', label: 'Дэлгүүр үзэх' }}
      />
    )
  }

  return (
    <div className="container-page max-w-4xl py-12">
      <h1 className="text-3xl sm:text-4xl">Миний захиалга</h1>
      <ul className="mt-10 divide-y divide-line border-y border-line">
        {orders.map((order) => (
          <li key={order.id}>
            <Link to={`/orders/${order.id}`} className="flex flex-wrap items-center justify-between gap-3 py-5 transition-colors hover:bg-sand/40 sm:px-3">
              <div className="min-w-0">
                <p className="text-sm">
                  {order.order_items.map((item) => `${item.product_name} × ${item.quantity}`).join(', ')}
                </p>
                <p className="mt-1 text-xs text-ash">
                  #{order.id.slice(0, 8)} · {formatDate(order.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <StatusBadge status={order.status} />
                <span className="text-sm">{formatPrice(order.total)}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
