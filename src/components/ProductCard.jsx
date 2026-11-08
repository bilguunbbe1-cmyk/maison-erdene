import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext.jsx'
import { useWishlist } from '../context/WishlistContext.jsx'
import { formatPrice, mainImage, productImages } from '../lib/format.js'
import { Icon } from './ui.jsx'

const NEW_FOR_DAYS = 14

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

const isNew = (product) =>
  product.created_at && Date.now() - new Date(product.created_at).getTime() < NEW_FOR_DAYS * 86400000

// One product tile: tall light-grey tile, photo, small name and price below.
// On devices with a mouse, the second photo fades in on hover.
export default function ProductCard({ product }) {
  const [first, second] = productImages(product)

  return (
    <article className="group relative">
      <Link to={`/products/${product.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-sand">
          {first ? (
            <img src={first.url} alt={product.name} loading="lazy" className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
          ) : (
            <div className="flex size-full items-center justify-center text-xs text-ash">Зураггүй</div>
          )}
          {second && (
            <img src={second.url} alt="" loading="lazy" aria-hidden="true" className="absolute inset-0 size-full object-cover opacity-0 transition-opacity duration-500 [@media(hover:hover)]:group-hover:opacity-100" />
          )}
          {/* One tag at most: stock news matters more than "new". */}
          <span className="absolute top-3 left-3 text-[11px]">
            {product.stock === 0 ? 'Дууссан' : product.stock === 1 ? 'Сүүлийн ширхэг' : isNew(product) ? 'Шинэ' : ''}
          </span>
        </div>
        <h3 className="mt-3 text-sm leading-5 font-normal">{product.name}</h3>
        <p className="mt-0.5 text-sm text-ash">{formatPrice(product.price)}</p>
      </Link>
      <WishlistButton productId={product.id} className="absolute top-1 right-1" />
    </article>
  )
}
