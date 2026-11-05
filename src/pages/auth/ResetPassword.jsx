import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { password, required, validate } from '../../lib/validation.js'
import { Field, PageLoader } from '../../components/ui.jsx'
import AuthCard from './AuthCard.jsx'

// The emailed link signs the user in with a temporary session, then lands here.
export default function ResetPassword() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [values, setValues] = useState({ password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)

  if (loading) return <PageLoader />

  if (!user) {
    return (
      <AuthCard title="Холбоос хүчингүй" subtitle="Холбоосын хугацаа дууссан байж магадгүй. Дахин хүсэлт илгээнэ үү.">
        <Link to="/forgot-password" className="btn-outline w-full">Дахин хүсэх</Link>
      </AuthCard>
    )
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = validate(values, { password: [required, password] })
    if (values.confirm !== values.password) nextErrors.confirm = 'Нууц үг таарахгүй байна.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password: values.password })
    setBusy(false)
    if (error) {
      toast.error('Нууц үгийг шинэчилж чадсангүй. Өмнөхөөс өөр нууц үг оруулна уу.')
      return
    }
    toast.success('Нууц үг шинэчлэгдлээ')
    navigate('/', { replace: true })
  }

  return (
    <AuthCard title="Шинэ нууц үг">
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <Field label="Шинэ нууц үг" hint="Хамгийн багадаа 8 тэмдэгт" error={errors.password}>
          <input type="password" autoComplete="new-password" className={`input ${errors.password ? 'input-error' : ''}`} value={values.password} onChange={(event) => setValues({ ...values, password: event.target.value })} />
        </Field>
        <Field label="Нууц үг давтах" error={errors.confirm}>
          <input type="password" autoComplete="new-password" className={`input ${errors.confirm ? 'input-error' : ''}`} value={values.confirm} onChange={(event) => setValues({ ...values, confirm: event.target.value })} />
        </Field>
        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy ? 'Хадгалж байна…' : 'Хадгалах'}
        </button>
      </form>
    </AuthCard>
  )
}
