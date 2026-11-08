import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { supabase, unwrap } from '../../lib/supabase.js'
import { useFetch } from '../../hooks/useFetch.js'
import { ErrorState, PageLoader } from '../../components/ui.jsx'
import { formatPrice, ORDER_STATUS } from '../../lib/format.js'

const INK = '#14110f'
const MARK = '#9a6c1f' // a more saturated gold: the UI gold is too grey for chart marks
const MUTED = '#6e665c'
const GRID = '#ddd5c6'

function Stat({ label, value, note }) {
  return (
    <div className="border border-line p-5">
      <p className="text-xs text-ash">{label}</p>
      <p className="mt-2 text-3xl font-light leading-none">{value}</p>
      {note && <p className="mt-2 text-xs text-ash">{note}</p>}
    </div>
  )
}

function ChartTooltip({ active, payload, label, format }) {
  if (!active || !payload?.length) return null
  return (
    <div className="border border-line bg-ivory px-3 py-2 text-xs shadow-sm">
      <p className="text-ash">{label}</p>
      <p className="mt-0.5 font-medium text-ink">{format(payload[0].value)}</p>
    </div>
  )
}

export default function Dashboard() {
  const { data: stats, loading, error, reload } = useFetch(() => unwrap(supabase.rpc('admin_stats')))

  if (error) return <ErrorState onRetry={reload} />
  if (loading) return <PageLoader />

  const byStatus = Object.keys(ORDER_STATUS).map((status) => ({
    label: ORDER_STATUS[status].label,
    count: stats.orders_by_status.find((row) => row.status === status)?.count ?? 0,
  }))

  const axisTick = { fill: MUTED, fontSize: 11 }

  return (
    <>
      <h1 className="text-4xl">Самбар</h1>

      <div className="mt-7 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat label="Нийт орлого" value={formatPrice(stats.revenue)} note="Төлөгдсөн захиалгаас" />
        <Stat label="Захиалга" value={stats.order_count} note={`${stats.paid_count} нь төлөгдсөн`} />
        <Stat label="Хэрэглэгч" value={stats.customer_count} />
        <Stat label="Дуусаж буй бараа" value={stats.low_stock} note="1 ба түүнээс бага үлдэгдэлтэй" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[3fr_2fr]">
        <section className="border border-line p-5">
          <h2 className="text-2xl">Орлого, сүүлийн 30 хоног</h2>
          <div className="mt-5 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.revenue_by_day} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={GRID} strokeWidth={0.5} vertical={false} />
                <XAxis dataKey="day" tick={axisTick} tickLine={false} axisLine={{ stroke: GRID }} interval={6} />
                <YAxis tick={axisTick} tickLine={false} axisLine={false} width={56} tickFormatter={(value) => `$${value.toLocaleString('en-US')}`} />
                <Tooltip cursor={{ fill: GRID, fillOpacity: 0.35 }} content={<ChartTooltip format={formatPrice} />} />
                <Bar dataKey="revenue" fill={MARK} radius={[4, 4, 0, 0]} maxBarSize={14} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="border border-line p-5">
          <h2 className="text-2xl">Захиалгын төлөв</h2>
          <div className="mt-5 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byStatus} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                <XAxis type="number" allowDecimals={false} hide />
                <YAxis type="category" dataKey="label" tick={{ fill: INK, fontSize: 11 }} tickLine={false} axisLine={false} width={112} />
                <Tooltip cursor={{ fill: GRID, fillOpacity: 0.35 }} content={<ChartTooltip format={(value) => `${value} захиалга`} />} />
                <Bar
                  dataKey="count"
                  fill={MARK}
                  barSize={14}
                  radius={[0, 4, 4, 0]}
                  isAnimationActive={false}
                  label={{ position: 'right', fill: INK, fontSize: 11 }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className="mt-6 border border-line p-5">
        <h2 className="text-2xl">Хамгийн их борлуулалттай</h2>
        {stats.top_products.length === 0 ? (
          <p className="mt-4 text-sm text-ash">Төлөгдсөн захиалга хараахан алга.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="table-admin">
              <thead>
                <tr><th>Цүнх</th><th className="text-right">Зарагдсан</th><th className="text-right">Орлого</th></tr>
              </thead>
              <tbody>
                {stats.top_products.map((product) => (
                  <tr key={product.name}>
                    <td>{product.name}</td>
                    <td className="text-right">{product.sold}</td>
                    <td className="text-right">{formatPrice(product.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  )
}
