import { Link } from 'react-router-dom'
import { supabase, unwrap } from '../lib/supabase.js'
import { useFetch } from '../hooks/useFetch.js'
import ProductCard from '../components/ProductCard.jsx'
import { ErrorState, PageLoader } from '../components/ui.jsx'

const CARD_FIELDS = 'id, name, slug, price, stock, color, product_images(url, position)'

const CATEGORY_TILES = [
  { slug: 'top-handle', name: 'Гар цүнх', image: '/bags/suld-top-handle-ivory.svg' },
  { slug: 'shoulder', name: 'Мөрний цүнх', image: '/bags/seruun-shoulder-gobi.svg' },
  { slug: 'tote', name: 'Тоут цүнх', image: '/bags/kherlen-tote-green.svg' },
]

export default function Home() {
  const { data: newest, loading, error, reload } = useFetch(() =>
    unwrap(
      supabase
        .from('products')
        .select(CARD_FIELDS)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(4),
    ),
  )

  return (
    <>
      <section className="bg-ink text-ivory">
        <div className="mx-auto grid max-w-7xl items-center lg:grid-cols-2">
          <div className="px-5 py-14 sm:px-8 lg:py-24">
            <p className="text-[11px] tracking-[0.28em] text-gold uppercase">Говь цуглуулга · 2026</p>
            <h1 className="mt-5 text-5xl leading-[1.05] sm:text-6xl xl:text-7xl">
              Тал нутгийн нарнаас сэдэвлэсэн
            </h1>
            <p className="mt-6 max-w-md text-sm leading-7 text-ivory/70">
              Гараар оёсон, өөрийн дугаартай гэрчилгээтэй цүнх. Хуурамч барааны эрсдэлгүйгээр,
              Монголоос шууд захиална.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link to="/shop?collection=gobi" className="btn bg-ivory text-ink hover:bg-gold hover:text-ink">
                Цуглуулга үзэх
              </Link>
              <Link to="/verify" className="btn-light">
                Баталгаа шалгах
              </Link>
            </div>
          </div>
          <img
            src="/bags/seruun-shoulder-gobi-dark.svg"
            alt="Сэрүүн мөрний цүнх, Говь хувилбар"
            className="aspect-square max-h-[70vh] w-full object-cover lg:max-h-none"
          />
        </div>
      </section>

      <section className="container-page py-20">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Шинэ</p>
            <h2 className="mt-2 text-4xl">Шинээр ирсэн</h2>
          </div>
          <Link to="/shop?sort=newest" className="link text-xs whitespace-nowrap">Бүгдийг үзэх</Link>
        </div>
        {error ? (
          <ErrorState onRetry={reload} />
        ) : loading ? (
          <PageLoader />
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-x-6">
            {newest.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      <section className="container-page pb-20">
        <div className="grid gap-4 sm:grid-cols-3">
          {CATEGORY_TILES.map((tile) => (
            <Link key={tile.slug} to={`/shop?category=${tile.slug}`} className="group relative block overflow-hidden bg-sand">
              <img src={tile.image} alt="" loading="lazy" className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
              <span className="absolute bottom-5 left-5 font-serif text-2xl">{tile.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-sand/50">
        <div className="container-page grid gap-10 py-20 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="eyebrow">Maison Erdene-ийн амлалт</p>
            <h2 className="mt-3 text-4xl leading-tight sm:text-5xl">Цүнх бүр өөрийн түүхтэй, өөрийн дугаартай</h2>
          </div>
          <div className="text-sm leading-7 text-ash">
            <p>
              Тансаг зэрэглэлийн цүнх худалдан авахад хамгийн том эрсдэл бол хуурамч бараа. Манайхаас
              зарагдсан цүнх бүрд төлбөр баталгаажмагц давтагдашгүй сериал дугаар олгогдоно.
            </p>
            <p className="mt-4">
              Дахин худалдах үед ч худалдан авагч тухайн дугаарыг шалгаж, цүнх жинхэнэ эсэхийг хэдхэн
              секундэд мэдэж болно.
            </p>
            <Link to="/verify" className="btn-outline mt-7">Сериал дугаар шалгах</Link>
          </div>
        </div>
      </section>
    </>
  )
}
