import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, unwrap } from '../../lib/supabase.js'
import { useFetch } from '../../hooks/useFetch.js'
import { EmptyState, ErrorState, PageLoader, Pagination } from '../../components/ui.jsx'
import { formatDate, formatPrice } from '../../lib/format.js'

const PAGE_SIZE = 15

// Read-only by design: payment rows are written by the webhook alone.
export default function Payments() {
  const [page, setPage] = useState(1)

  const { data, loading, error, reload } = useFetch(() => {
    const from = (page - 1) * PAGE_SIZE
    return unwrap(
      supabase
        .from('payments')
        .select('id, order_id, provider, provider_ref, amount, status, created_at', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, from + PAGE_SIZE - 1),
    )
  }, [page])

  const payments = data?.data ?? []

  return (
    <>
      <h1 className="text-4xl">Төлбөр</h1>
      <div className="mt-6">
        {error ? (
          <ErrorState onRetry={reload} />
        ) : loading && !data ? (
          <PageLoader />
        ) : payments.length === 0 ? (
          <EmptyState title="Төлбөр алга байна" text="Амжилттай төлбөр энд автоматаар бүртгэгдэнэ." />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-admin">
              <thead>
                <tr><th>Огноо</th><th>Захиалга</th><th>Систем</th><th>Дүн</th><th>Төлөв</th></tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="whitespace-nowrap text-ash">{formatDate(payment.created_at, true)}</td>
                    <td><Link to={`/orders/${payment.order_id}`} className="link">#{payment.order_id.slice(0, 8)}</Link></td>
                    <td className="capitalize">{payment.provider}</td>
                    <td>{formatPrice(payment.amount)}</td>
                    <td>
                      {payment.status === 'succeeded' ? (
                        <span className="text-ok">Амжилттай</span>
                      ) : (
                        <span className="text-danger">Буцаалт шаардлагатай: цуцлагдсан захиалгад төлсөн</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Pagination page={page} pageCount={Math.ceil((data?.count ?? 0) / PAGE_SIZE)} onChange={setPage} />
    </>
  )
}
