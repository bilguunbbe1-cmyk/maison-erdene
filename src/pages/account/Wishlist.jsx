import { supabase, unwrap } from '../../lib/supabase.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useWishlist } from '../../context/WishlistContext.jsx'
import { useFetch } from '../../hooks/useFetch.js'
import ProductCard from '../../components/ProductCard.jsx'
import { EmptyState, ErrorState, PageLoader } from '../../components/ui.jsx'

export default function Wishlist() {
  const { user } = useAuth()
  const { ids } = useWishlist()

  const { data: rows, loading, error, reload } = useFetch(
    () =>
      unwrap(
        supabase
          .from('wishlist_items')
          .select('product:products(id, name, slug, price, stock, color, created_at, product_images(url, position))')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
      ),
    [user.id],
  )

  if (error) return <ErrorState onRetry={reload} />
  if (loading) return <PageLoader />

  // Filtering by ids makes a bag disappear as soon as its heart is un-clicked.
  // A null product is one that was hidden after it was saved.
  const products = rows.map((row) => row.product).filter((product) => product && ids.has(product.id))

  if (products.length === 0) {
    return (
      <EmptyState
        title="Хадгалсан цүнх алга"
        text="Таалагдсан цүнхнийхээ зүрхэн дээр дарж энд хадгалаарай."
        action={{ to: '/shop', label: 'Дэлгүүр үзэх' }}
      />
    )
  }

  return (
    <div className="container-page py-12">
      <h1 className="text-3xl sm:text-4xl">Хадгалсан</h1>
      <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-x-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  )
}
