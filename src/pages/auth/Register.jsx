import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { email, password, phone, required, validate } from '../../lib/validation.js'
import { Field } from '../../components/ui.jsx'
import AuthCard from './AuthCard.jsx'

export default function Register() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [values, setValues] = useState({ fullName: '', phone: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    if (!loading && user) navigate(location.state?.from ?? '/', { replace: true })
  }, [user, loading, location.state, navigate])

  const update = (field) => (event) => setValues({ ...values, [field]: event.target.value })

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = validate(values, {
      fullName: [required],
      phone: [required, phone],
      email: [required, email],
      password: [required, password],
    })
    if (values.confirm !== values.password) nextErrors.confirm = 'Нууц үг таарахгүй байна.'
    setErrors(nextErrors)
    setFormError('')
    if (Object.keys(nextErrors).length > 0) return

    setBusy(true)
    const { data, error } = await supabase.auth.signUp({
      email: values.email.trim(),
      password: values.password,
      options: {
        // Read by the handle_new_user trigger, which creates the profile row.
        data: { full_name: values.fullName.trim(), phone: values.phone.trim() },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    })
    setBusy(false)

    if (error) {
      setFormError('Бүртгэл амжилтгүй боллоо. Мэдээллээ шалгаад дахин оролдоно уу.')
      return
    }
    // With email confirmation on, there is no session until the link is clicked.
    if (!data.session) setSent(true)
  }

  if (sent) {
    return (
      <AuthCard
        title="Имэйлээ шалгана уу"
        subtitle={`${values.email} хаяг руу баталгаажуулах холбоос илгээлээ. Холбоос дээр дарсны дараа нэвтэрнэ үү.`}
      >
        <Link to="/login" className="btn-outline w-full">Нэвтрэх хуудас</Link>
      </AuthCard>
    )
  }

  return (
    <AuthCard title="Бүртгүүлэх">
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <Field label="Овог нэр" error={errors.fullName}>
          <input autoComplete="name" className={`input ${errors.fullName ? 'input-error' : ''}`} value={values.fullName} onChange={update('fullName')} />
        </Field>
        <Field label="Утас" error={errors.phone}>
          <input type="tel" inputMode="numeric" autoComplete="tel" className={`input ${errors.phone ? 'input-error' : ''}`} value={values.phone} onChange={update('phone')} />
        </Field>
        <Field label="Имэйл" error={errors.email}>
          <input type="email" autoComplete="email" className={`input ${errors.email ? 'input-error' : ''}`} value={values.email} onChange={update('email')} />
        </Field>
        <Field label="Нууц үг" hint="Хамгийн багадаа 8 тэмдэгт" error={errors.password}>
          <input type="password" autoComplete="new-password" className={`input ${errors.password ? 'input-error' : ''}`} value={values.password} onChange={update('password')} />
        </Field>
        <Field label="Нууц үг давтах" error={errors.confirm}>
          <input type="password" autoComplete="new-password" className={`input ${errors.confirm ? 'input-error' : ''}`} value={values.confirm} onChange={update('confirm')} />
        </Field>
        {formError && <p className="text-sm text-danger" role="alert">{formError}</p>}
        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy ? 'Бүртгэж байна…' : 'Бүртгүүлэх'}
        </button>
      </form>
      <p className="mt-6 text-center text-xs">
        Бүртгэлтэй юу? <Link to="/login" state={location.state} className="link">Нэвтрэх</Link>
      </p>
    </AuthCard>
  )
}
