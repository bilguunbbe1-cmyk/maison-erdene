import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import { Icon } from './ui.jsx'

const NAV = [
  { to: '/shop', label: 'Бүх цүнх' },
  { to: '/shop?category=top-handle', label: 'Гар цүнх' },
  { to: '/shop?collection=limited', label: 'Хязгаарлагдмал' },
  { to: '/verify', label: 'Баталгаа шалгах' },
]

function Header() {
  const { user, isAdmin, signOut } = useAuth()
  const { count } = useCart()
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setMenuOpen(false)
  }, [location])

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-ivory/95 backdrop-blur">
      <div className="container-page grid h-18 grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="flex items-center">
          <button
            type="button"
            className="-ml-2 cursor-pointer p-2 lg:hidden"
            aria-label={menuOpen ? 'Цэс хаах' : 'Цэс нээх'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <Icon name={menuOpen ? 'close' : 'menu'} />
          </button>
          <nav className="hidden gap-6 lg:flex">
            {NAV.slice(0, 3).map((item) => (
              <NavLink key={item.to} to={item.to} className="text-xs whitespace-nowrap text-ink/80 transition-colors hover:text-gold-dark">
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <Link to="/" className="text-center font-serif text-xl tracking-[0.3em] whitespace-nowrap sm:text-2xl">
          ERDENE
        </Link>

        <div className="flex items-center justify-end gap-0.5 sm:gap-2">
          <Link to="/shop" className="hidden p-2 transition-colors hover:text-gold-dark sm:block" aria-label="Хайх">
            <Icon name="search" />
          </Link>
          <Link to="/wishlist" className="hidden p-2 transition-colors hover:text-gold-dark sm:block" aria-label="Хадгалсан">
            <Icon name="heart" />
          </Link>
          <Link to={user ? '/profile' : '/login'} className="p-2 transition-colors hover:text-gold-dark" aria-label="Миний бүртгэл">
            <Icon name="user" />
          </Link>
          <Link to="/cart" className="relative -mr-2 p-2 transition-colors hover:text-gold-dark" aria-label={`Сагс, ${count} бараа`}>
            <Icon name="bag" />
            {count > 0 && (
              <span className="absolute top-0 right-0 flex size-4 items-center justify-center rounded-full bg-ink text-[9px] text-ivory">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>

      {menuOpen && (
        <nav className="container-page flex flex-col gap-1 border-t border-line py-4 lg:hidden">
          {NAV.map((item) => (
            <Link key={item.to} to={item.to} className="py-2.5 text-sm">
              {item.label}
            </Link>
          ))}
          <Link to="/wishlist" className="py-2.5 text-sm">Хадгалсан</Link>
          {user && <Link to="/orders" className="py-2.5 text-sm">Миний захиалга</Link>}
          {isAdmin && <Link to="/admin" className="py-2.5 text-sm text-gold-dark">Админ самбар</Link>}
          {user && (
            <button type="button" onClick={signOut} className="cursor-pointer py-2.5 text-left text-sm text-ash">
              Гарах
            </button>
          )}
        </nav>
      )}
    </header>
  )
}

function Footer() {
  const { isAdmin } = useAuth()
  return (
    <footer className="mt-24 bg-ink text-ivory">
      <div className="container-page grid gap-10 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <p className="font-serif text-2xl tracking-[0.3em]">ERDENE</p>
          <p className="mt-4 max-w-sm text-sm leading-6 text-ivory/60">
            Цүнх бүр өөрийн дугаартай баталгааны гэрчилгээтэй. Жинхэнэ эсэхийг нь хэн ч,
            хэзээ ч шалгах боломжтой.
          </p>
        </div>
        <div>
          <p className="text-[11px] tracking-[0.28em] text-ivory/50 uppercase">Дэлгүүр</p>
          <ul className="mt-4 space-y-2.5 text-sm text-ivory/80">
            <li><Link className="hover:text-gold" to="/shop">Бүх цүнх</Link></li>
            <li><Link className="hover:text-gold" to="/shop?collection=new-arrivals">Шинэ цуглуулга</Link></li>
            <li><Link className="hover:text-gold" to="/shop?collection=gobi">Говь</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-[11px] tracking-[0.28em] text-ivory/50 uppercase">Үйлчилгээ</p>
          <ul className="mt-4 space-y-2.5 text-sm text-ivory/80">
            <li><Link className="hover:text-gold" to="/verify">Баталгаа шалгах</Link></li>
            <li><Link className="hover:text-gold" to="/orders">Миний захиалга</Link></li>
            {isAdmin && <li><Link className="hover:text-gold" to="/admin">Админ самбар</Link></li>}
          </ul>
        </div>
      </div>
      <div className="border-t border-ivory/10">
        <p className="container-page py-5 text-xs text-ivory/50">
          © {new Date().getFullYear()} Maison Erdene. SWE334 хичээлийн төсөл. Зохиомол брэнд.
        </p>
      </div>
    </footer>
  )
}

export default function Layout() {
  const { pathname } = useLocation()

  // Each new page starts at the top, as a normal website does.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
