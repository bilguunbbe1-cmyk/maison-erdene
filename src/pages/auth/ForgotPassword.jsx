import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import { email, required, validate } from '../../lib/validation.js'
import { Field } from '../../components/ui.jsx'
import AuthCard from './AuthCard.jsx'

export default function ForgotPassword() {
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    const errors = validate({ email: value }, { email: [required, email] })
    setError(errors.email ?? '')
    if (errors.email) return

    setBusy(true)
    const { error: requestError } = await supabase.auth.resetPasswordForEmail(value.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setBusy(false)
    if (requestError) setError('Хүсэлт амжилтгүй боллоо. Хэсэг хугацааны дараа дахин оролдоно уу.')
    else setSent(true)
  }

  if (sent) {
    return (
      <AuthCard
        title="Имэйлээ шалгана уу"
        subtitle="Хаяг бүртгэлтэй бол нууц үг сэргээх холбоос тань руу очно."
      >
        <Link to="/login" className="btn-outline w-full">Нэвтрэх хуудас</Link>
      </AuthCard>
    )
  }

  return (
    <AuthCard title="Нууц үг сэргээх" subtitle="Бүртгэлтэй имэйлээ оруулна уу.">
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <Field label="Имэйл" error={error}>
          <input type="email" autoComplete="email" className={`input ${error ? 'input-error' : ''}`} value={value} onChange={(event) => setValue(event.target.value)} />
        </Field>
        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy ? 'Илгээж байна…' : 'Холбоос илгээх'}
        </button>
      </form>
      <p className="mt-6 text-center text-xs"><Link to="/login" className="link">Нэвтрэх хуудас руу буцах</Link></p>
    </AuthCard>
  )
}
