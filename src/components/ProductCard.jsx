import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext.jsx'
import { useWishlist } from '../context/WishlistContext.jsx'
import { formatPrice, mainImage } from '../lib/format.js'
import { Icon } from './ui.jsx'

export function ProductImage({ product, className = '' }) {
  const url = mainImage(product)
  return url ? (
    <img src={url} alt={product.name} loading="lazy" className={`aspect-square w-full object-cover ${className}`} />
  ) : (
    <div className={`flex aspect-square w-full items-center justify-center bg-sand text-xs text-ash ${className}`}>
      Зураггүй
    </div>
  )
}

export function WishlistButton({ productId, className = '' }) {
  const { user } = useAuth()
  const { ids, toggle } = useWishlist()
  const navigate = useNavigate()
  const saved = ids.has(productId)

  const handleClick = async (event) => {
    // The button sits on a card that is a link. Stay on the current page.
    event.preventDefault()
    if (!user) {
      navigate('/login')
      return
    }
    try {
      const added = await toggle(productId)
      toast.success(added ? 'Хадгалагдлаа' : 'Хадгалснаас хасагдлаа')
    } catch {
      toast.error('Алдаа гарлаа. Дахин оролдоно уу.')
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={saved}
      aria-label={saved ? 'Хадгалснаас хасах' : 'Хадгалах'}
      className={`cursor-pointer p-2 transition-colors hover:text-gold-dark ${saved ? 'text-gold-dark' : ''} ${className}`}
    >
      <Icon name="heart" filled={saved} />
    </button>
  )
}

export default function ProductCard({ product }) {
  return (
    <article className="group relative">
      <Link to={`/products/${product.slug}`} className="block">
        <div className="relative overflow-hidden bg-sand">
          <ProductImage product={product} className="transition-transform duration-700 group-hover:scale-[1.04]" />
          {product.stock === 0 && (
            <span className="absolute bottom-3 left-3 bg-ivory px-2.5 py-1 text-[11px]">Дууссан</span>
          )}
          {product.stock === 1 && (
            <span className="absolute bottom-3 left-3 bg-ink px-2.5 py-1 text-[11px] text-ivory">Сүүлийн ширхэг</span>
          )}
        </div>
        <h3 className="mt-4 font-serif text-xl leading-tight">{product.name}</h3>
        <p className="mt-1 text-xs text-ash">{product.color}</p>
        <p className="mt-2 text-sm">{formatPrice(product.price)}</p>
      </Link>
      <WishlistButton productId={product.id} className="absolute top-1.5 right-1.5" />
    </article>
  )
}
