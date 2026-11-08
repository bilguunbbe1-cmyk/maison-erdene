import { Link } from 'react-router-dom'
import { supabase, unwrap } from '../lib/supabase.js'
import { useFetch } from '../hooks/useFetch.js'
import { MEDIA } from '../lib/media.js'
import CollectionGrid from '../components/CollectionGrid.jsx'
import { CampaignVideo } from '../components/Media.jsx'
import { ErrorState, PageLoader } from '../components/ui.jsx'

const CARD_FIELDS = 'id, name, slug, price, stock, color, created_at, product_images(url, position)'

// The home page is laid out as a collection page: title, campaign film,
// a short story, then the bags with campaign photos placed among them.
export default function Home() {
  const { data, loading, error, reload } = useFetch(() =>
    unwrap(
      supabase
        .from('products')
        .select(CARD_FIELDS, { count: 'exact' })
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(14),
    ),
  )

  return (
    <>
      <section className="container-wide px-5 pt-8 pb-6">
        <p className="text-xs text-ash">Цүнх</p>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-3">
          <h1 className="text-3xl font-light sm:text-4xl">Говь цуглуулга 2027</h1>
          {data && <span className="text-sm text-ash">{data.count}</span>}
        </div>
      </section>

      <section className="bg-ink">
        <CampaignVideo media={MEDIA.hero} className="mx-auto aspect-[4/5] max-h-[85vh] w-full object-cover sm:aspect-video" />
      </section>

      <section className="container-page py-14 text-center sm:py-20">
        <h2 className="text-2xl font-light sm:text-3xl">Тал нутгийн нар, элсний өнгө</h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-ash">
          Говийн элсэн манхнаас сэдэвлэсэн өнгө, гараар оёсон арьс, нарны дүрст алтан түгжээ.
          Цүнх бүр өөрийн дугаартай баталгааны гэрчилгээтэй.
        </p>
      </section>

      <section className="container-wide">
        {error ? (
          <ErrorState onRetry={reload} />
        ) : loading ? (
          <PageLoader />
        ) : (
          <CollectionGrid products={data.data} editorial={MEDIA.editorial} />
        )}
        <div className="mt-14 text-center">
          <Link to="/shop" className="btn-outline">Бүх цүнх үзэх</Link>
        </div>
      </section>

      <section className="mt-24 grid bg-sand lg:grid-cols-2">
        <CampaignVideo media={MEDIA.craft} className="aspect-video size-full object-cover lg:aspect-auto lg:min-h-[520px]" />
        <div className="flex flex-col justify-center px-6 py-14 sm:px-12 lg:px-16">
          <p className="eyebrow">Maison Erdene-ийн амлалт</p>
          <h2 className="mt-3 text-3xl leading-tight font-light sm:text-4xl">Цүнх бүр өөрийн түүхтэй, өөрийн дугаартай</h2>
          <p className="mt-5 max-w-md text-sm leading-7 text-ash">
            Тансаг цүнх худалдан авахад хамгийн том эрсдэл бол хуурамч бараа. Манайхаас зарагдсан цүнх бүрд
            төлбөр баталгаажмагц давтагдашгүй сериал дугаар олгогдож, хэн ч хэдхэн секундэд шалгах боломжтой.
          </p>
          <div>
            <Link to="/verify" className="btn-outline mt-8">Сериал дугаар шалгах</Link>
          </div>
        </div>
      </section>
    </>
  )
}
