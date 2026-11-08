import { useState } from 'react'
import toast from 'react-hot-toast'
import { supabase, unwrap } from '../../lib/supabase.js'
import { useFetch } from '../../hooks/useFetch.js'
import { EmptyState, ErrorState, PageLoader, Pagination } from '../../components/ui.jsx'
import { formatDate } from '../../lib/format.js'
import { topicLabel } from '../../lib/contact.js'

const PAGE_SIZE = 15

// Help desk inbox: requests from the help center form, newest first.
export default function Support() {
  const [status, setStatus] = useState('open')
  const [page, setPage] = useState(1)
  const [busyId, setBusyId] = useState(null)

  const { data, loading, error, reload } = useFetch(() => {
    let query = supabase
      .from('support_requests')
      .select('id, name, email, topic, message, status, created_at, user_id', { count: 'exact' })
    if (status) query = query.eq('status', status)
    const from = (page - 1) * PAGE_SIZE
    return unwrap(query.order('created_at', { ascending: false }).range(from, from + PAGE_SIZE - 1))
  }, [status, page])

  const toggle = async (request) => {
    setBusyId(request.id)
    try {
      const next = request.status === 'open' ? 'closed' : 'open'
      await unwrap(supabase.from('support_requests').update({ status: next }).eq('id', request.id))
      toast.success(next === 'closed' ? 'Шийдвэрлэсэн гэж тэмдэглэлээ' : 'Дахин нээлээ')
      reload()
    } catch {
      toast.error('Төлөв өөрчилж чадсангүй.')
    } finally {
      setBusyId(null)
    }
  }

  const requests = data?.data ?? []

  return (
    <>
      <h1 className="text-4xl">Тусламж</h1>
      <p className="mt-2 text-sm text-ash">Тусламжийн төвийн формоор ирсэн хүсэлтүүд.</p>

      <select className="input mt-6 w-auto" aria-label="Төлөв" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }}>
        <option value="open">Хүлээгдэж буй</option>
        <option value="closed">Шийдвэрлэсэн</option>
        <option value="">Бүгд</option>
      </select>

      <div className="mt-6">
        {error ? (
          <ErrorState onRetry={reload} />
        ) : loading && !data ? (
          <PageLoader />
        ) : requests.length === 0 ? (
          <EmptyState title="Хүсэлт алга" text="Шинэ хүсэлт ирэхэд энд харагдана." />
        ) : (
          <ul className="divide-y divide-line border-y border-line">
            {requests.map((request) => (
              <li key={request.id} className="grid gap-3 py-5 sm:grid-cols-[1fr_auto] sm:gap-6">
                <div className="min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{request.name}</span>
                    <span className="text-ash"> · {request.email}{request.user_id ? '' : ' · зочин'}</span>
                  </p>
                  <p className="mt-1 text-xs text-ash">{topicLabel(request.topic)} · {formatDate(request.created_at, true)}</p>
                  <p className="mt-3 text-sm leading-6 whitespace-pre-line">{request.message}</p>
                </div>
                <div className="flex items-start gap-3 sm:flex-col sm:items-end">
                  <a
                    className="btn-outline btn-sm"
                    href={`mailto:${request.email}?subject=${encodeURIComponent('Maison Erdene: таны хүсэлт')}`}
                  >
                    Хариу бичих
                  </a>
                  <button type="button" className="link text-xs" disabled={busyId === request.id} onClick={() => toggle(request)}>
                    {request.status === 'open' ? 'Шийдвэрлэсэн гэж тэмдэглэх' : 'Дахин нээх'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Pagination page={page} pageCount={Math.ceil((data?.count ?? 0) / PAGE_SIZE)} onChange={setPage} />
    </>
  )
}
