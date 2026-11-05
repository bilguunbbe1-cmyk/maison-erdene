import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { supabase, unwrap } from '../lib/supabase.js'
import { useFetch } from '../hooks/useFetch.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import ProductCard, { WishlistButton } from '../components/ProductCard.jsx'
import { EmptyState, ErrorState, PageLoader } from '../components/ui.jsx'
import { formatPrice } from '../lib/format.js'

async function fetchProduct(slug) {
  const product = await unwrap(
    supabase
      .from('products')
      .select('*, category:categories(name, slug), product_images(id, url, position)')
      .eq('slug', slug)
      .maybeSingle(),
  )
  if (!product) return null

  const related = await unwrap(
    supabase
      .from('products')
      .select('id, name, slug, price, stock, color, product_images(url, position)')
      .eq('category_id', product.category_id)
      .eq('is_active', true)
      .neq('id', product.id)
      .limit(4),
  )
  return { product, related }
}

export default function ProductDetail() {
  const { slug } = useParams()
  const { user } = useAuth()
  const { addItem } = useCart()
  const navigate = useNavigate()
  const location = useLocation()
  const [selected, setSelected] = useState(0)
  const [adding, setAdding] = useState(false)

  const { data, loading, error, reload } = useFetch(() => {
    setSelected(0)
    return fetchProduct(slug)
  }, [slug])

  if (error) return <ErrorState onRetry={reload} />
  if (loading || data === undefined) return <PageLoader />
  if (!data) {
    return (
      <EmptyState
        title="Цүнх олдсонгүй"
        text="Энэ бүтээгдэхүүн устсан эсвэл холбоос буруу байна."
        action={{ to: '/shop', label: 'Дэлгүүр рүү буцах' }}
      />
    )
  }

  const { product, related } = data
  const images = [...product.product_images].sort((a, b) => a.position - b.position)
  const purchasable = product.is_active && product.stock > 0

  const handleAdd = async () => {
    if (!user) {
      // Guests can browse. Buying needs an account, then back to this bag.
      navigate('/login', { state: { from: location.pathname } })
      return
    }
    setAdding(true)
    try {
      await addItem(product)
      toast.success('Сагсанд нэмэгдлээ')
    } catch (addError) {
      toast.error(addError.message)
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="container-page py-8 lg:py-12">
      <nav className="mb-6 text-xs text-ash" aria-label="Байршил">
        <Link to="/shop" className="hover:text-ink">Дэлгүүр</Link>
        <span className="mx-2">/</span>
        <Link to={`/shop?category=${product.category.slug}`} className="hover:text-ink">{product.category.name}</Link>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:gap-14">
        <div>
          <div className="bg-sand">
            {images[selected] ? (
              <img src={images[selected].url} alt={product.name} className="aspect-square w-full object-cover" />
            ) : (
              <div className="flex aspect-square items-center justify-center text-sm text-ash">Зураггүй</div>
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-3">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => setSelected(index)}
                  aria-label={`${index + 1}-р зураг`}
                  aria-current={index === selected}
                  className={`size-20 cursor-pointer border ${index === selected ? 'border-ink' : 'border-transparent'}`}
                >
                  <img src={image.url} alt="" className="size-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="eyebrow">{product.category.name}</p>
          <h1 className="mt-3 text-4xl leading-tight sm:text-5xl">{product.name}</h1>
          <p className="mt-4 text-lg">{formatPrice(product.price)}</p>
          <p className="mt-6 text-sm leading-7 text-ash">{product.description}</p>

          <dl className="mt-7 divide-y divide-line border-y border-line text-sm">
            {[
              ['Материал', product.material],
              ['Өнгө', product.color],
              ['Хэмжээ', product.dimensions],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 py-3">
                <dt className="text-ash">{label}</dt>
                <dd className="text-right">{value}</dd>
              </div>
            ))}
          </dl>

          <p className="mt-5 text-xs" aria-live="polite">
            {!product.is_active && <span className="text-danger">Энэ бүтээгдэхүүн нуугдсан байна.</span>}
            {product.is_active && product.stock === 0 && <span className="text-danger">Одоогоор дууссан</span>}
            {product.is_active && product.stock === 1 && <span className="text-gold-dark">Сүүлийн ширхэг</span>}
            {product.is_active && product.stock > 1 && <span className="text-ok">Бэлэн байгаа</span>}
          </p>

          <div className="mt-4 flex items-center gap-2">
            <button type="button" className="btn-primary flex-1" disabled={!purchasable || adding} onClick={handleAdd}>
              {adding ? 'Нэмж байна…' : purchasable ? 'Сагсанд нэмэх' : 'Дууссан'}
            </button>
            <WishlistButton productId={product.id} className="flex size-12 items-center justify-center border border-line" />
          </div>

          <div className="mt-7 border border-line p-5">
            <p className="font-serif text-xl">Баталгааны гэрчилгээтэй</p>
            <p className="mt-2 text-xs leading-6 text-ash">
              Төлбөр баталгаажмагц энэ цүнхэнд давтагдашгүй сериал дугаар олгогдоно. Жинхэнэ эсэхийг нь{' '}
              <Link to="/verify" className="link">эндээс</Link> хэн ч шалгаж болно.
            </p>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-24">
          <h2 className="mb-8 text-3xl">Төстэй загварууд</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-x-6">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
