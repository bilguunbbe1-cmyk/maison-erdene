import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import { Icon } from './ui.jsx'
import { CONTACT } from '../lib/contact.js'

// Links in the slide-out menu, grouped like a fashion house's main menu.
const MENU = [
  {
    title: 'Цүнх',
    links: [
      { to: '/shop?collection=new-arrivals', label: 'Шинэ цуглуулга' },
      { to: '/shop', label: 'Бүх цүнх' },
      { to: '/shop?category=top-handle', label: 'Гар цүнх' },
      { to: '/shop?category=shoulder', label: 'Мөрний цүнх' },
      { to: '/shop?category=tote', label: 'Тоут цүнх' },
      { to: '/shop?category=crossbody', label: 'Кроссбоди' },
      { to: '/shop?category=clutch', label: 'Клатч' },
    ],
  },
  {
    title: 'Цуглуулга',
    links: [
      { to: '/shop?collection=gobi', label: 'Говь' },
      { to: '/shop?collection=classics', label: 'Сонгодог' },
      { to: '/shop?collection=limited', label: 'Хязгаарлагдмал хувилбар' },
    ],
  },
]

function MenuDrawer({ open, onClose }) {
  const { user, isAdmin, signOut } = useAuth()

  // Esc closes the menu, and the page behind it stops scrolling while open.
  useEffect(() => {
    if (!open) return undefined
    const onKey = (event) => event.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  return (
    <div className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      <nav
        aria-label="Үндсэн цэс"
        className={`absolute inset-y-0 left-0 flex w-full max-w-sm flex-col overflow-y-auto bg-white px-8 py-6 transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <button type="button" onClick={onClose} className="-ml-2 flex cursor-pointer items-center gap-2 self-start p-2 text-sm" tabIndex={open ? 0 : -1}>
          <Icon name="close" /> Хаах
        </button>
        {MENU.map((group) => (
          <div key={group.title} className="mt-8">
            <p className="eyebrow">{group.title}</p>
            <ul className="mt-3 space-y-1">
              {group.links.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="block py-1.5 text-lg font-light hover:text-gold-dark" tabIndex={open ? 0 : -1}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div className="mt-auto space-y-1 border-t border-line pt-6 text-sm">
          <Link to="/verify" className="block py-1.5" tabIndex={open ? 0 : -1}>Баталгаа шалгах</Link>
          <Link to="/help" className="block py-1.5" tabIndex={open ? 0 : -1}>Тусламж, холбоо барих</Link>
          <Link to="/wishlist" className="block py-1.5" tabIndex={open ? 0 : -1}>Хадгалсан</Link>
          {user && <Link to="/orders" className="block py-1.5" tabIndex={open ? 0 : -1}>Миний захиалга</Link>}
          {isAdmin && <Link to="/admin" className="block py-1.5 text-gold-dark" tabIndex={open ? 0 : -1}>Админ самбар</Link>}
          {user ? (
            <button type="button" onClick={signOut} className="block cursor-pointer py-1.5 text-ash" tabIndex={open ? 0 : -1}>Гарах</button>
          ) : (
            <Link to="/login" className="block py-1.5" tabIndex={open ? 0 : -1}>Нэвтрэх</Link>
          )}
        </div>
      </nav>
    </div>
  )
}

function Header() {
  const { user } = useAuth()
  const { count } = useCart()
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setMenuOpen(false)
  }, [location])

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto grid h-16 w-full max-w-[1680px] grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-1 sm:gap-4">
            <button
              type="button"
              className="-ml-2 flex cursor-pointer items-center gap-2 p-2 text-sm"
              aria-label="Цэс нээх"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
            >
              <Icon name="menu" />
              <span className="hidden sm:inline">Цэс</span>
            </button>
            <Link to="/shop" className="flex items-center gap-2 p-2 text-sm" aria-label="Хайх">
              <Icon name="search" />
              <span className="hidden sm:inline">Хайх</span>
            </Link>
          </div>

          <Link to="/" className="font-display text-xl tracking-[0.35em] whitespace-nowrap sm:text-2xl">
            ERDENE
          </Link>

          <div className="flex items-center justify-end gap-0.5 sm:gap-2">
            <Link to="/wishlist" className="hidden p-2 transition-colors hover:text-gold-dark sm:block" aria-label="Хадгалсан">
              <Icon name="heart" />
            </Link>
            <Link to={user ? '/profile' : '/login'} className="p-2 transition-colors hover:text-gold-dark" aria-label="Миний бүртгэл">
              <Icon name="user" />
            </Link>
            <Link to="/cart" className="relative -mr-2 p-2 transition-colors hover:text-gold-dark" aria-label={`Сагс, ${count} бараа`}>
              <Icon name="bag" />
              {count > 0 && (
                <span className="absolute top-0 right-0 flex size-4 items-center justify-center rounded-full bg-ink text-[9px] text-white">
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>
      <MenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  )
}

function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-white">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <p className="font-display text-2xl tracking-[0.35em]">ERDENE</p>
          <p className="mt-4 max-w-sm text-sm leading-6 text-ash">
            Цүнх бүр өөрийн дугаартай баталгааны гэрчилгээтэй. Жинхэнэ эсэхийг нь хэн ч, хэзээ ч шалгах боломжтой.
          </p>
        </div>
        <div>
          <p className="eyebrow">Дэлгүүр</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link className="hover:text-gold-dark" to="/shop">Бүх цүнх</Link></li>
            <li><Link className="hover:text-gold-dark" to="/shop?collection=new-arrivals">Шинэ цуглуулга</Link></li>
            <li><Link className="hover:text-gold-dark" to="/shop?collection=gobi">Говь</Link></li>
          </ul>
        </div>
        <div>
          <p className="eyebrow">Үйлчилгээ</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link className="hover:text-gold-dark" to="/help">Тусламжийн төв</Link></li>
            <li><Link className="hover:text-gold-dark" to="/verify">Баталгаа шалгах</Link></li>
            <li><Link className="hover:text-gold-dark" to="/orders">Миний захиалга</Link></li>
          </ul>
          <ul className="mt-5 space-y-1.5 text-sm text-ash">
            <li><a className="hover:text-ink" href={CONTACT.phoneHref}>{CONTACT.phone}</a></li>
            <li><a className="hover:text-ink" href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <p className="container-page py-5 text-xs text-ash">
          © {new Date().getFullYear()} Maison Erdene. SWE334 хичээлийн төсөл. Зохиомол брэнд. Кампанит зураг, бичлэгийг AI-аар бүтээсэн.
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
