import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { supabase, unwrap } from '../../lib/supabase.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { phone, required, validate } from '../../lib/validation.js'
import { Field } from '../../components/ui.jsx'

export default function Profile() {
  const { user, profile, isAdmin, refreshProfile, signOut } = useAuth()
  const [values, setValues] = useState({ full_name: '', phone: '' })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (profile) setValues({ full_name: profile.full_name, phone: profile.phone })
  }, [profile])

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = validate(values, { full_name: [required], phone: [required, phone] })
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setBusy(true)
    try {
      await unwrap(
        supabase
          .from('profiles')
          .update({ full_name: values.full_name.trim(), phone: values.phone.trim() })
          .eq('id', user.id),
      )
      await refreshProfile()
      toast.success('Хадгалагдлаа')
    } catch {
      toast.error('Хадгалж чадсангүй.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="container-page max-w-xl py-12">
      <h1 className="text-3xl sm:text-4xl">Миний бүртгэл</h1>
      <p className="mt-3 text-sm text-ash">{user.email}</p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link to="/orders" className="btn-outline btn-sm">Миний захиалга</Link>
        <Link to="/wishlist" className="btn-outline btn-sm">Хадгалсан</Link>
        {isAdmin && <Link to="/admin" className="btn-primary btn-sm">Админ самбар</Link>}
      </div>

      <form onSubmit={handleSubmit} noValidate className="mt-10 space-y-5">
        <Field label="Овог нэр" error={errors.full_name}>
          <input className={`input ${errors.full_name ? 'input-error' : ''}`} value={values.full_name} onChange={(event) => setValues({ ...values, full_name: event.target.value })} />
        </Field>
        <Field label="Утас" error={errors.phone}>
          <input type="tel" inputMode="numeric" className={`input ${errors.phone ? 'input-error' : ''}`} value={values.phone} onChange={(event) => setValues({ ...values, phone: event.target.value })} />
        </Field>
        <div className="flex flex-wrap justify-between gap-3">
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? 'Хадгалж байна…' : 'Хадгалах'}
          </button>
          <button type="button" className="btn-outline" onClick={signOut}>Гарах</button>
        </div>
      </form>
    </div>
  )
}
