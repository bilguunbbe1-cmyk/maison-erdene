import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { supabase, unwrap } from '../../lib/supabase.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import { ConfirmDialog, EmptyState, ErrorState, PageLoader, Pagination } from '../../components/ui.jsx'
import { formatDate } from '../../lib/format.js'

const PAGE_SIZE = 15

export default function Users() {
  const { user: me } = useAuth()
  const [search, setSearch] = useState('')
  const [term, setTerm] = useState('')
  const [page, setPage] = useState(1)
  const [target, setTarget] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setTerm(search.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const { data, loading, error, reload } = useFetch(() => {
    let query = supabase.from('profiles').select('id, email, full_name, phone, role, created_at', { count: 'exact' })
    if (term) query = query.ilike('email', `%${term}%`)
    const from = (page - 1) * PAGE_SIZE
    return unwrap(query.order('created_at', { ascending: false }).range(from, from + PAGE_SIZE - 1))
  }, [term, page])

  const nextRole = target?.role === 'admin' ? 'customer' : 'admin'

  const confirmRole = async () => {
    setBusy(true)
    try {
      await unwrap(supabase.rpc('admin_set_user_role', { p_user: target.id, p_role: nextRole }))
      toast.success('Эрх шинэчлэгдлээ')
      reload()
    } catch (roleError) {
      toast.error(roleError.message)
    } finally {
      setBusy(false)
      setTarget(null)
    }
  }

  const users = data?.data ?? []

  return (
    <>
      <h1 className="text-4xl">Хэрэглэгч</h1>
      <input type="search" className="input mt-6 max-w-sm" placeholder="Имэйлээр хайх…" aria-label="Имэйлээр хайх" value={search} onChange={(event) => setSearch(event.target.value)} />

      <div className="mt-6">
        {error ? (
          <ErrorState onRetry={reload} />
        ) : loading && !data ? (
          <PageLoader />
        ) : users.length === 0 ? (
          <EmptyState title="Хэрэглэгч олдсонгүй" />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-admin">
              <thead>
                <tr><th>Нэр</th><th>Имэйл</th><th>Утас</th><th>Бүртгүүлсэн</th><th>Эрх</th><th><span className="sr-only">Үйлдэл</span></th></tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.full_name || '—'}</td>
                    <td>{user.email}</td>
                    <td className="text-ash">{user.phone || '—'}</td>
                    <td className="whitespace-nowrap text-ash">{formatDate(user.created_at)}</td>
                    <td>{user.role === 'admin' ? 'Админ' : 'Хэрэглэгч'}</td>
                    <td className="text-right whitespace-nowrap">
                      {user.id !== me.id && (
                        <button type="button" className="link text-xs" onClick={() => setTarget(user)}>
                          {user.role === 'admin' ? 'Админ эрх хасах' : 'Админ болгох'}
                        </button>
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

      <ConfirmDialog
        open={Boolean(target)}
        title="Эрх өөрчлөх үү?"
        text={`${target?.email} хэрэглэгчийн эрх «${nextRole === 'admin' ? 'Админ' : 'Хэрэглэгч'}» болно.`}
        confirmLabel="Тийм"
        busy={busy}
        onConfirm={confirmRole}
        onCancel={() => setTarget(null)}
      />
    </>
  )
}
