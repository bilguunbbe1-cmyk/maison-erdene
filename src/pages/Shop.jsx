import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase, unwrap } from '../lib/supabase.js'
import { useFetch } from '../hooks/useFetch.js'
import ProductCard from '../components/ProductCard.jsx'
import { EmptyState, ErrorState, Pagination, PageLoader } from '../components/ui.jsx'

const PAGE_SIZE = 8

const SORTS = {
  newest: { label: 'Шинэ нь эхэндээ', column: 'created_at', ascending: false },
  oldest: { label: 'Хуучин нь эхэндээ', column: 'created_at', ascending: true },
  'price-asc': { label: 'Үнэ: багаас их', column: 'price', ascending: true },
  'price-desc': { label: 'Үнэ: ихээс бага', column: 'price', ascending: false },
  name: { label: 'Нэр: А-Я', column: 'name', ascending: true },
}

async function fetchProducts({ q, category, collection, min, max, sort, page }) {
  // !inner turns the join into a filter: only bags with a matching row remain.
  // "collections" goes through the product_collections link table (N:M).
  const fields = [
    'id, name, slug, price, stock, color, product_images(url, position)',
    `categories${category ? '!inner' : ''}(slug)`,
    ...(collection ? ['collections!inner(slug)'] : []),
  ].join(', ')

  let query = supabase.from('products').select(fields, { count: 'exact' }).eq('is_active', true)

  if (q) query = query.ilike('name', `%${q}%`)
  if (category) query = query.eq('categories.slug', category)
  if (collection) query = query.eq('collections.slug', collection)
  if (Number(min) > 0) query = query.gte('price', Number(min))
  if (Number(max) > 0) query = query.lte('price', Number(max))

  const { column, ascending } = SORTS[sort] ?? SORTS.newest
  const from = (page - 1) * PAGE_SIZE

  return unwrap(query.order(column, { ascending }).order('id').range(from, from + PAGE_SIZE - 1))
}

export default function Shop() {
  // Filters live in the URL, so a filtered page can be shared or refreshed.
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const category = params.get('category') ?? ''
  const collection = params.get('collection') ?? ''
  const min = params.get('min') ?? ''
  const max = params.get('max') ?? ''
  const sort = params.get('sort') ?? 'newest'
  const page = Math.max(1, Number(params.get('page')) || 1)

  // What is typed appears at once. The query waits until typing pauses.
  const [search, setSearch] = useState(q)
  const [priceMin, setPriceMin] = useState(min)
  const [priceMax, setPriceMax] = useState(max)

  const updateParams = (changes) => {
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        for (const [key, value] of Object.entries(changes)) {
          if (value) next.set(key, value)
          else next.delete(key)
        }
        // Any filter change starts again from the first page.
        if (!('page' in changes)) next.delete('page')
        return next
      },
      { replace: true },
    )
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== q || priceMin !== min || priceMax !== max) {
        updateParams({ q: search.trim(), min: priceMin, max: priceMax })
      }
    }, 350)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, priceMin, priceMax])

  // Keeps the inputs correct when the URL changes from a header link.
  useEffect(() => {
    setSearch(q)
    setPriceMin(min)
    setPriceMax(max)
  }, [q, min, max])

  const { data: filters } = useFetch(async () => {
    const [categories, collections] = await Promise.all([
      unwrap(supabase.from('categories').select('name, slug').order('id')),
      unwrap(supabase.from('collections').select('name, slug').order('id')),
    ])
    return { categories, collections }
  })

  const { data, loading, error, reload } = useFetch(
    () => fetchProducts({ q, category, collection, min, max, sort, page }),
    [q, category, collection, min, max, sort, page],
  )

  const products = data?.data ?? []
  const total = data?.count ?? 0
  const hasFilters = q || category || collection || min || max

  const clearFilters = () => {
    setSearch('')
    setPriceMin('')
    setPriceMax('')
    setParams({}, { replace: true })
  }

  return (
    <div className="container-page py-12">
      <p className="eyebrow">Дэлгүүр</p>
      <h1 className="mt-2 text-5xl">Бүх цүнх</h1>

      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr_1.3fr]">
        <input
          type="search"
          className="input col-span-2 lg:col-span-1"
          placeholder="Нэрээр хайх…"
          aria-label="Нэрээр хайх"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select
          className="input"
          aria-label="Ангилал"
          value={category}
          onChange={(event) => updateParams({ category: event.target.value })}
        >
          <option value="">Бүх ангилал</option>
          {filters?.categories.map((item) => (
            <option key={item.slug} value={item.slug}>{item.name}</option>
          ))}
        </select>
        <select
          className="input"
          aria-label="Цуглуулга"
          value={collection}
          onChange={(event) => updateParams({ collection: event.target.value })}
        >
          <option value="">Бүх цуглуулга</option>
          {filters?.collections.map((item) => (
            <option key={item.slug} value={item.slug}>{item.name}</option>
          ))}
        </select>
        <input
          type="number"
          min="0"
          className="input"
          placeholder="Доод үнэ $"
          aria-label="Доод үнэ"
          value={priceMin}
          onChange={(event) => setPriceMin(event.target.value)}
        />
        <input
          type="number"
          min="0"
          className="input"
          placeholder="Дээд үнэ $"
          aria-label="Дээд үнэ"
          value={priceMax}
          onChange={(event) => setPriceMax(event.target.value)}
        />
        <select
          className="input col-span-2 lg:col-span-1"
          aria-label="Эрэмбэлэх"
          value={sort}
          onChange={(event) => updateParams({ sort: event.target.value })}
        >
          {Object.entries(SORTS).map(([key, option]) => (
            <option key={key} value={key}>{option.label}</option>
          ))}
        </select>
      </div>

      <div className="mt-5 flex min-h-6 items-center justify-between text-xs text-ash">
        <span aria-live="polite">{!loading && !error && `${total} цүнх олдлоо`}</span>
        {hasFilters && (
          <button type="button" className="link" onClick={clearFilters}>Шүүлтүүр цэвэрлэх</button>
        )}
      </div>

      <div className="mt-6">
        {error ? (
          <ErrorState onRetry={reload} />
        ) : loading && !data ? (
          <PageLoader />
        ) : products.length === 0 ? (
          <EmptyState
            title="Илэрц олдсонгүй"
            text="Таны хайлтад тохирох цүнх алга байна. Өөр үгээр хайх эсвэл шүүлтүүрээ багасгаад үзнэ үү."
          />
        ) : (
          <div className={`grid grid-cols-2 gap-x-4 gap-y-10 transition-opacity lg:grid-cols-4 lg:gap-x-6 ${loading ? 'opacity-50' : ''}`}>
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>

      <Pagination
        page={page}
        pageCount={Math.ceil(total / PAGE_SIZE)}
        onChange={(next) => {
          updateParams({ page: next > 1 ? String(next) : '' })
          window.scrollTo(0, 0)
        }}
      />
    </div>
  )
}
