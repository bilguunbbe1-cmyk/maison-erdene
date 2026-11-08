import { Link, NavLink, Outlet } from 'react-router-dom'

const LINKS = [
  { to: '/admin', label: 'Самбар', end: true },
  { to: '/admin/products', label: 'Бүтээгдэхүүн' },
  { to: '/admin/categories', label: 'Ангилал' },
  { to: '/admin/collections', label: 'Цуглуулга' },
  { to: '/admin/orders', label: 'Захиалга' },
  { to: '/admin/payments', label: 'Төлбөр' },
  { to: '/admin/users', label: 'Хэрэглэгч' },
  { to: '/admin/support', label: 'Тусламж' },
]

export default function AdminLayout() {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[230px_1fr]">
      <aside className="bg-ink text-ivory lg:sticky lg:top-0 lg:h-screen">
        <div className="flex items-center justify-between px-5 py-5 lg:block lg:px-7 lg:py-8">
          <Link to="/" className="font-display text-xl tracking-[0.3em]">ERDENE</Link>
          <p className="text-[11px] tracking-[0.2em] text-gold uppercase lg:mt-1">Админ</p>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:px-4">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `px-3 py-2.5 text-sm whitespace-nowrap transition-colors ${
                  isActive ? 'bg-ivory/10 text-ivory' : 'text-ivory/60 hover:text-ivory'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <Link to="/" className="hidden px-7 py-6 text-xs text-ivory/50 hover:text-ivory lg:absolute lg:bottom-0 lg:block">
          ← Дэлгүүр рүү буцах
        </Link>
      </aside>
      <main className="min-w-0 px-5 py-8 sm:px-8 lg:py-10">
        <Outlet />
      </main>
    </div>
  )
}
