import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { startCheckout } from '../../lib/supabase.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useCart } from '../../context/CartContext.jsx'
import { phone, required, validate } from '../../lib/validation.js'
import { formatPrice } from '../../lib/format.js'
import { Field, PageLoader } from '../../components/ui.jsx'
import { isUnavailable } from './Cart.jsx'

const CITIES = ['Улаанбаатар', 'Дархан', 'Эрдэнэт', 'Бусад аймаг']

export default function Checkout() {
  const { profile } = useAuth()
  const { items, total, loading, refresh } = useCart()
  const [values, setValues] = useState({
    name: profile?.full_name ?? '',
    phone: profile?.phone ?? '',
    city: CITIES[0],
    address: '',
    note: '',
  })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)

  if (loading && items.length === 0) return <PageLoader />
  // Nothing to buy, or something needs fixing first: the cart page explains why.
  if (!busy && (items.length === 0 || items.some(isUnavailable))) return <Navigate to="/cart" replace />

  const update = (field) => (event) => setValues({ ...values, [field]: event.target.value })

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = validate(values, {
      name: [required],
      phone: [required, phone],
      city: [required],
      address: [required],
    })
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setBusy(true)
    try {
      const url = await startCheckout({ shipping: values })
      // Leaves the app for Stripe's hosted page, which handles the card details.
      window.location.assign(url)
    } catch (error) {
      toast.error(error.message)
      await refresh()
      setBusy(false)
    }
  }

  return (
    <div className="container-page py-12">
      <h1 className="text-3xl sm:text-4xl">Захиалга</h1>
      <form onSubmit={handleSubmit} noValidate className="mt-10 grid gap-10 lg:grid-cols-[1fr_380px]">
        <section className="space-y-5">
          <h2 className="text-2xl">Хүргэлтийн мэдээлэл</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Хүлээн авагчийн нэр" error={errors.name}>
              <input autoComplete="name" className={`input ${errors.name ? 'input-error' : ''}`} value={values.name} onChange={update('name')} />
            </Field>
            <Field label="Утас" error={errors.phone}>
              <input type="tel" inputMode="numeric" autoComplete="tel" className={`input ${errors.phone ? 'input-error' : ''}`} value={values.phone} onChange={update('phone')} />
            </Field>
          </div>
          <Field label="Хот, аймаг" error={errors.city}>
            <select className="input" value={values.city} onChange={update('city')}>
              {CITIES.map((city) => <option key={city}>{city}</option>)}
            </select>
          </Field>
          <Field label="Дэлгэрэнгүй хаяг" error={errors.address}>
            <textarea rows={3} autoComplete="street-address" className={`input py-3 ${errors.address ? 'input-error' : ''}`} value={values.address} onChange={update('address')} />
          </Field>
          <Field label="Тэмдэглэл (заавал биш)">
            <input className="input" value={values.note} onChange={update('note')} />
          </Field>
        </section>

        <aside className="self-start border border-line p-7 lg:sticky lg:top-28">
          <h2 className="text-2xl">Таны захиалга</h2>
          <ul className="mt-5 space-y-3 text-sm">
            {items.map((item) => (
              <li key={item.product_id} className="flex justify-between gap-3">
                <span>{item.product?.name} × {item.quantity}</span>
                <span className="whitespace-nowrap">{formatPrice((item.product?.price ?? 0) * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex items-baseline justify-between border-t border-line pt-5">
            <span className="text-sm">Нийт</span>
            <span className="text-2xl font-light">{formatPrice(total)}</span>
          </div>
          <button type="submit" className="btn-primary mt-6 w-full" disabled={busy}>
            {busy ? 'Төлбөр рүү шилжиж байна…' : 'Төлбөр төлөх'}
          </button>
          <p className="mt-3 text-xs leading-5 text-ash">
            Цүнх таны нэр дээр 30 минут хадгалагдана. Энэ хугацаанд төлөгдөөгүй бол захиалга автоматаар цуцлагдана.
          </p>
        </aside>
      </form>
    </div>
  )
}
