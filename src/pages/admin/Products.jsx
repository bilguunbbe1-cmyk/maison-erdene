import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { supabase, unwrap } from '../../lib/supabase.js'
import { useFetch } from '../../hooks/useFetch.js'
import { ConfirmDialog, EmptyState, ErrorState, PageLoader, Pagination } from '../../components/ui.jsx'
import { formatDate, formatPrice, isForeignKeyError, mainImage } from '../../lib/format.js'

const PAGE_SIZE = 10

export default function Products() {
  const [search, setSearch] = useState('')
  const [term, setTerm] = useState('')
  const [page, setPage] = useState(1)
  const [toDelete, setToDelete] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setTerm(search.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const { data, loading, error, reload } = useFetch(() => {
    let query = supabase
      .from('products')
      .select('id, name, slug, price, stock, is_active, created_at, category:categories(name), product_images(url, position, storage_path)', { count: 'exact' })
    if (term) query = query.ilike('name', `%${term}%`)
    const from = (page - 1) * PAGE_SIZE
    return unwrap(query.order('created_at', { ascending: false }).range(from, from + PAGE_SIZE - 1))
  }, [term, page])

  const toggleActive = async (product) => {
    try {
      await unwrap(supabase.from('products').update({ is_active: !product.is_active }).eq('id', product.id))
      toast.success(product.is_active ? 'Нуугдлаа' : 'Нээгдлээ')
      reload()
    } catch {
      toast.error('Өөрчилж чадсангүй.')
    }
  }

  const confirmDelete = async () => {
    setBusy(true)
    try {
      await unwrap(supabase.from('products').delete().eq('id', toDelete.id))
      // Delete files only once the row is gone, so a blocked delete keeps its images.
      const paths = toDelete.product_images.map((image) => image.storage_path).filter(Boolean)
      if (paths.length > 0) await supabase.storage.from('product-images').remove(paths)
      toast.success('Устгагдлаа')
      setToDelete(null)
      reload()
    } catch (deleteError) {
      toast.error(
        isForeignKeyError(deleteError)
          ? 'Захиалгатай бүтээгдэхүүнийг устгах боломжгүй. Оронд нь нууна уу.'
          : 'Устгаж чадсангүй.',
      )
      setToDelete(null)
    } finally {
      setBusy(false)
    }
  }

  const products = data?.data ?? []

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-4xl">Бүтээгдэхүүн</h1>
        <Link to="/admin/products/new" className="btn-primary btn-sm">Шинээр нэмэх</Link>
      </div>

      <input
        type="search"
        className="input mt-6 max-w-sm"
        placeholder="Нэрээр хайх…"
        aria-label="Нэрээр хайх"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />

      <div className="mt-6">
        {error ? (
          <ErrorState onRetry={reload} />
        ) : loading && !data ? (
          <PageLoader />
        ) : products.length === 0 ? (
          <EmptyState title="Бүтээгдэхүүн олдсонгүй" />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-admin">
              <thead>
                <tr>
                  <th>Цүнх</th><th>Ангилал</th><th>Үнэ</th><th>Үлдэгдэл</th><th>Огноо</th><th>Төлөв</th><th><span className="sr-only">Үйлдэл</span></th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="size-11 shrink-0 bg-sand">
                          {mainImage(product) && <img src={mainImage(product)} alt="" className="size-full object-cover" />}
                        </div>
                        <span>{product.name}</span>
                      </div>
                    </td>
                    <td className="text-ash">{product.category?.name}</td>
                    <td>{formatPrice(product.price)}</td>
                    <td className={product.stock <= 1 ? 'text-danger' : ''}>{product.stock}</td>
                    <td className="whitespace-nowrap text-ash">{formatDate(product.created_at)}</td>
                    <td>
                      <button type="button" className="link text-xs" onClick={() => toggleActive(product)}>
                        {product.is_active ? 'Идэвхтэй' : 'Нуугдсан'}
                      </button>
                    </td>
                    <td className="text-right whitespace-nowrap">
                      <Link to={`/admin/products/${product.id}`} className="link mr-4 text-xs">Засах</Link>
                      <button type="button" className="link text-xs text-danger" onClick={() => setToDelete(product)}>Устгах</button>
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
        open={Boolean(toDelete)}
        title="Устгах уу?"
        text={`«${toDelete?.name}» бүтээгдэхүүн бүрмөсөн устана. Энэ үйлдлийг буцаах боломжгүй.`}
        busy={busy}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </>
  )
}
