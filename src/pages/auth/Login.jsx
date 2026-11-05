import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { email, required, validate } from '../../lib/validation.js'
import { Field } from '../../components/ui.jsx'
import AuthCard from './AuthCard.jsx'

export default function Login() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const destination = location.state?.from ?? '/'

  const [values, setValues] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!loading && user) navigate(destination, { replace: true })
  }, [user, loading, destination, navigate])

  const update = (field) => (event) => setValues({ ...values, [field]: event.target.value })

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = validate(values, { email: [required, email], password: [required] })
    setErrors(nextErrors)
    setFormError('')
    if (Object.keys(nextErrors).length > 0) return

    setBusy(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email.trim(),
      password: values.password,
    })
    setBusy(false)
    // The same message either way, so nobody can test which emails are registered.
    if (error) setFormError('Имэйл эсвэл нууц үг буруу байна.')
  }

  return (
    <AuthCard title="Нэвтрэх" subtitle="Захиалга, хадгалсан цүнхээ үзэхийн тулд нэвтэрнэ үү.">
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <Field label="Имэйл" error={errors.email}>
          <input type="email" autoComplete="email" className={`input ${errors.email ? 'input-error' : ''}`} value={values.email} onChange={update('email')} />
        </Field>
        <Field label="Нууц үг" error={errors.password}>
          <input type="password" autoComplete="current-password" className={`input ${errors.password ? 'input-error' : ''}`} value={values.password} onChange={update('password')} />
        </Field>
        {formError && <p className="text-sm text-danger" role="alert">{formError}</p>}
        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy ? 'Нэвтэрч байна…' : 'Нэвтрэх'}
        </button>
      </form>
      <div className="mt-6 flex justify-between text-xs">
        <Link to="/forgot-password" className="link">Нууц үгээ мартсан?</Link>
        <Link to="/register" state={location.state} className="link">Шинээр бүртгүүлэх</Link>
      </div>
    </AuthCard>
  )
}
