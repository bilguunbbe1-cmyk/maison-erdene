import { Link } from 'react-router-dom'
import ProductCard from './ProductCard.jsx'
import { FallbackImage } from './Media.jsx'

// Editorial photos are placed after these product counts, like a fashion
// house's collection page that mixes campaign images into the grid.
const EDITORIAL_AFTER = [2, 8]

function EditorialTile({ item }) {
  return (
    <Link to={item.to} className="group relative col-span-2 block aspect-[4/5] overflow-hidden bg-ink lg:row-span-2 lg:aspect-auto">
      <FallbackImage
        src={item.src}
        fallback={item.fallback}
        focus={item.focus}
        alt=""
        loading="lazy"
        className="absolute inset-0 size-full object-cover transition-transform duration-[1200ms] group-hover:scale-[1.03]"
      />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-6 pt-24 text-white">
        <p className="text-[11px] tracking-[0.2em] uppercase opacity-80">{item.eyebrow}</p>
        <p className="mt-1 text-2xl font-light">{item.title}</p>
      </div>
    </Link>
  )
}

export default function CollectionGrid({ products, editorial = [] }) {
  const cells = []
  products.forEach((product, index) => {
    const slot = EDITORIAL_AFTER.indexOf(index)
    if (slot !== -1 && editorial[slot]) cells.push({ type: 'editorial', item: editorial[slot] })
    cells.push({ type: 'product', product })
  })

  return (
    <div className="grid grid-cols-2 gap-x-2 gap-y-8 lg:grid-cols-4">
      {cells.map((cell) =>
        cell.type === 'editorial' ? (
          <EditorialTile key={cell.item.src} item={cell.item} />
        ) : (
          <ProductCard key={cell.product.id} product={cell.product} />
        ),
      )}
    </div>
  )
}
