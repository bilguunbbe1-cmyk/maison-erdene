import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { supabase, unwrap } from '../../lib/supabase.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { email, phone, required, validate } from '../../lib/validation.js'
import { Field } from '../../components/ui.jsx'

const RESEND_SECONDS = 60

// Turns Supabase Auth errors into messages a customer can act on.
function authMessage(error) {
  const text = error?.message ?? ''
  if (/expired|invalid|otp/i.test(text) && !/rate/i.test(text)) return 'Код буруу эсвэл хугацаа нь дууссан байна.'
  if (/rate|seconds|too many/i.test(text)) return 'Хэт олон удаа оролдлоо. Түр хүлээгээд дахин оролдоно уу.'
  if (/already|registered|exists/i.test(text)) return 'Энэ имэйлээр өөр бүртгэл байна.'
  return text || 'Алдаа гарлаа. Дахин оролдоно уу.'
}

// Counts down after a code is sent, so the customer cannot ask for a new one every second.
function useCooldown() {
  const [left, setLeft] = useState(0)
  useEffect(() => {
    if (left <= 0) return undefined
    const timer = setTimeout(() => setLeft(left - 1), 1000)
    return () => clearTimeout(timer)
  }, [left])
  return [left, () => setLeft(RESEND_SECONDS)]
}

function CodeInput({ label, hint, value, onChange, error, autoFocus }) {
  return (
    <Field label={label} hint={hint} error={error}>
      <input
        className={`input font-mono tracking-[0.4em] ${error ? 'input-error' : ''}`}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={10}
        placeholder="••••••••"
        autoFocus={autoFocus}
        value={value}
        onChange={(event) => onChange(event.target.value.replace(/\D/g, ''))}
      />
    </Field>
  )
}

const codeError = (value) => (/^\d{6,10}$/.test(value) ? '' : 'Имэйлээр ирсэн кодыг оруулна уу.')

// Each email has a code and a link. The link opens this page again, so remember
// which phone number was being confirmed until the customer comes back.
const PENDING_PHONE = 'maison-erdene:pending-phone'
const returnUrl = (what) => `${window.location.origin}/profile?confirm=${what}`

function readPendingPhone() {
  try {
    const saved = JSON.parse(localStorage.getItem(PENDING_PHONE))
    return saved && Date.now() - saved.at < 60 * 60 * 1000 ? saved.phone : null
  } catch {
    return null
  }
}

function savePendingPhone(phoneNumber) {
  try {
    if (phoneNumber) localStorage.setItem(PENDING_PHONE, JSON.stringify({ phone: phoneNumber, at: Date.now() }))
    else localStorage.removeItem(PENDING_PHONE)
  } catch {
    // Private browsing can block storage. Entering the code still works.
  }
}

// Email: Supabase sends one code to the current address and one to the new one.
// The change happens only after both codes are entered, so a stolen session
// alone cannot move the account to someone else's email.
function ChangeEmail({ onDone, onCancel }) {
  const { user } = useAuth()
  const [step, setStep] = useState('form')
  const [newEmail, setNewEmail] = useState('')
  const [codes, setCodes] = useState({ current: '', next: '' })
  const [currentConfirmed, setCurrentConfirmed] = useState(false)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [cooldown, startCooldown] = useCooldown()

  const sendCodes = async () => {
    setBusy(true)
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail.trim() }, { emailRedirectTo: returnUrl('email') })
      if (error) throw error
      startCooldown()
      setStep('codes')
      toast.success('Хоёр имэйл рүү код илгээлээ')
    } catch (sendError) {
      toast.error(authMessage(sendError))
    } finally {
      setBusy(false)
    }
  }

  const handleRequest = (event) => {
    event.preventDefault()
    const nextErrors = validate({ newEmail }, { newEmail: [required, email] })
    if (!nextErrors.newEmail && newEmail.trim().toLowerCase() === user.email.toLowerCase()) {
      nextErrors.newEmail = 'Одоогийн имэйлээс өөр хаяг оруулна уу.'
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length === 0) sendCodes()
  }

  const handleVerify = async (event) => {
    event.preventDefault()
    const nextErrors = {}
    if (!currentConfirmed && codeError(codes.current)) nextErrors.current = codeError(codes.current)
    if (codeError(codes.next)) nextErrors.next = codeError(codes.next)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setBusy(true)
    try {
      if (!currentConfirmed) {
        const { error } = await supabase.auth.verifyOtp({ email: user.email, token: codes.current, type: 'email_change' })
        if (error) {
          setErrors({ current: authMessage(error) })
          return
        }
        setCurrentConfirmed(true)
      }
      const { error } = await supabase.auth.verifyOtp({ email: newEmail.trim(), token: codes.next, type: 'email_change' })
      if (error) {
        setErrors({ next: authMessage(error) })
        return
      }
      await supabase.auth.refreshSession()
      toast.success('Имэйл солигдлоо')
      onDone()
    } finally {
      setBusy(false)
    }
  }

  if (step === 'form') {
    return (
      <form onSubmit={handleRequest} noValidate className="mt-4 space-y-4 border border-line p-5">
        <Field label="Шинэ имэйл" error={errors.newEmail} hint="Хуучин болон шинэ хаяг руу тус бүр нэг код очно.">
          <input type="email" autoComplete="email" autoFocus className={`input ${errors.newEmail ? 'input-error' : ''}`} value={newEmail} onChange={(event) => setNewEmail(event.target.value)} />
        </Field>
        <div className="flex flex-wrap gap-3">
          <button type="submit" className="btn-primary btn-sm" disabled={busy}>{busy ? 'Илгээж байна…' : 'Код илгээх'}</button>
          <button type="button" className="btn-outline btn-sm" onClick={onCancel}>Болих</button>
        </div>
      </form>
    )
  }

  return (
    <form onSubmit={handleVerify} noValidate className="mt-4 space-y-4 border border-line p-5">
      <p className="text-xs leading-5 text-ash">Хоёр имэйлд ирсэн кодыг оруулна уу, эсвэл хоёр имэйл дэх холбоос дээр тус бүр дарна уу.</p>
      {currentConfirmed ? (
        <p className="text-sm text-ok">✓ {user.email} хаягийн код баталгаажлаа.</p>
      ) : (
        <CodeInput label={`Одоогийн имэйлд ирсэн код (${user.email})`} value={codes.current} onChange={(value) => setCodes({ ...codes, current: value })} error={errors.current} autoFocus />
      )}
      <CodeInput label={`Шинэ имэйлд ирсэн код (${newEmail.trim()})`} value={codes.next} onChange={(value) => setCodes({ ...codes, next: value })} error={errors.next} />
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="btn-primary btn-sm" disabled={busy}>{busy ? 'Шалгаж байна…' : 'Баталгаажуулах'}</button>
        <button type="button" className="btn-outline btn-sm" onClick={onCancel}>Болих</button>
        <button type="button" className="link text-xs" disabled={cooldown > 0 || busy} onClick={() => { setCurrentConfirmed(false); setCodes({ current: '', next: '' }); sendCodes() }}>
          {cooldown > 0 ? `Дахин илгээх (${cooldown})` : 'Код дахин илгээх'}
        </button>
      </div>
    </form>
  )
}

// Phone: a code goes to the account's email. Entering it opens a fresh session,
// and the database only accepts the new number from such a fresh session
// (see update_my_phone in migration 0004).
function ChangePhone({ onDone, onCancel }) {
  const { user } = useAuth()
  const [step, setStep] = useState('form')
  const [newPhone, setNewPhone] = useState('')
  const [code, setCode] = useState('')
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [cooldown, startCooldown] = useCooldown()

  const sendCode = async () => {
    setBusy(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: user.email,
        options: { shouldCreateUser: false, emailRedirectTo: returnUrl('phone') },
      })
      if (error) throw error
      savePendingPhone(newPhone.trim())
      startCooldown()
      setStep('code')
      toast.success(`${user.email} рүү код илгээлээ`)
    } catch (sendError) {
      toast.error(authMessage(sendError))
    } finally {
      setBusy(false)
    }
  }

  const handleRequest = (event) => {
    event.preventDefault()
    const nextErrors = validate({ newPhone }, { newPhone: [required, phone] })
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length === 0) sendCode()
  }

  const handleVerify = async (event) => {
    event.preventDefault()
    if (codeError(code)) {
      setErrors({ code: codeError(code) })
      return
    }
    setBusy(true)
    try {
      const { error } = await supabase.auth.verifyOtp({ email: user.email, token: code, type: 'email' })
      if (error) {
        setErrors({ code: authMessage(error) })
        return
      }
      await unwrap(supabase.rpc('update_my_phone', { p_phone: newPhone.trim() }))
      savePendingPhone(null)
      toast.success('Утасны дугаар солигдлоо')
      onDone()
    } catch (saveError) {
      toast.error(saveError.message)
    } finally {
      setBusy(false)
    }
  }

  if (step === 'form') {
    return (
      <form onSubmit={handleRequest} noValidate className="mt-4 space-y-4 border border-line p-5">
        <Field label="Шинэ утасны дугаар" error={errors.newPhone} hint={`Баталгаажуулах код ${user.email} хаяг руу очно.`}>
          <input type="tel" inputMode="numeric" autoComplete="tel" autoFocus className={`input ${errors.newPhone ? 'input-error' : ''}`} value={newPhone} onChange={(event) => setNewPhone(event.target.value)} />
        </Field>
        <div className="flex flex-wrap gap-3">
          <button type="submit" className="btn-primary btn-sm" disabled={busy}>{busy ? 'Илгээж байна…' : 'Код илгээх'}</button>
          <button type="button" className="btn-outline btn-sm" onClick={onCancel}>Болих</button>
        </div>
      </form>
    )
  }

  return (
    <form onSubmit={handleVerify} noValidate className="mt-4 space-y-4 border border-line p-5">
      <p className="text-sm text-ash">Шинэ дугаар: <span className="text-ink">{newPhone.trim()}</span></p>
      <p className="text-xs leading-5 text-ash">Имэйлд ирсэн кодыг оруулна уу, эсвэл имэйл дэх холбоос дээр дарна уу.</p>
      <CodeInput label={`${user.email} хаягт ирсэн код`} value={code} onChange={setCode} error={errors.code} autoFocus />
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="btn-primary btn-sm" disabled={busy}>{busy ? 'Шалгаж байна…' : 'Баталгаажуулах'}</button>
        <button type="button" className="btn-outline btn-sm" onClick={onCancel}>Болих</button>
        <button type="button" className="link text-xs" disabled={cooldown > 0 || busy} onClick={sendCode}>
          {cooldown > 0 ? `Дахин илгээх (${cooldown})` : 'Код дахин илгээх'}
        </button>
      </div>
    </form>
  )
}

function ContactRow({ label, value, editing, onEdit, children }) {
  return (
    <div className="border-t border-line py-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="eyebrow">{label}</p>
          <p className="mt-1.5 text-sm">{value || <span className="text-ash">Оруулаагүй</span>}</p>
        </div>
        {!editing && <button type="button" className="link text-xs" onClick={onEdit}>Солих</button>}
      </div>
      {editing && children}
    </div>
  )
}

export default function Profile() {
  const { user, profile, isAdmin, refreshProfile, signOut } = useAuth()
  const [fullName, setFullName] = useState('')
  const [nameError, setNameError] = useState('')
  const [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState(null) // 'email' | 'phone' | null
  const [searchParams, setSearchParams] = useSearchParams()
  const confirming = searchParams.get('confirm')

  useEffect(() => {
    if (profile) setFullName(profile.full_name)
  }, [profile])

  // The customer came back from a link in one of our emails.
  useEffect(() => {
    if (!confirming) return
    setSearchParams({}, { replace: true })

    if (confirming === 'phone') {
      const pending = readPendingPhone()
      if (!pending) return
      // The link opened a fresh session, which update_my_phone requires.
      unwrap(supabase.rpc('update_my_phone', { p_phone: pending }))
        .then(async () => {
          savePendingPhone(null)
          await refreshProfile()
          toast.success('Утасны дугаар солигдлоо')
        })
        .catch((error) => toast.error(error.message))
    }

    if (confirming === 'email') {
      // Pick up the new address if both links have now been opened.
      supabase.auth.refreshSession().then(({ data }) => {
        const pendingEmail = data?.user?.new_email
        if (pendingEmail) toast(`Баталгаажлаа. ${pendingEmail} хаяг руу ирсэн холбоосыг мөн дарна уу.`)
        else toast.success('Имэйл баталгаажлаа')
        refreshProfile()
      })
    }
  }, [confirming, setSearchParams, refreshProfile])

  const saveName = async (event) => {
    event.preventDefault()
    const message = required(fullName)
    setNameError(message)
    if (message) return

    setBusy(true)
    try {
      await unwrap(supabase.from('profiles').update({ full_name: fullName.trim() }).eq('id', user.id))
      await refreshProfile()
      toast.success('Хадгалагдлаа')
    } catch {
      toast.error('Хадгалж чадсангүй.')
    } finally {
      setBusy(false)
    }
  }

  const finish = async () => {
    setEditing(null)
    await refreshProfile()
  }

  return (
    <div className="container-page max-w-xl py-12">
      <h1 className="text-3xl sm:text-4xl">Миний бүртгэл</h1>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link to="/orders" className="btn-outline btn-sm">Миний захиалга</Link>
        <Link to="/wishlist" className="btn-outline btn-sm">Хадгалсан</Link>
        <Link to="/help" className="btn-outline btn-sm">Тусламж</Link>
        {isAdmin && <Link to="/admin" className="btn-primary btn-sm">Админ самбар</Link>}
      </div>

      <form onSubmit={saveName} noValidate className="mt-10 space-y-5">
        <Field label="Овог нэр" error={nameError}>
          <input className={`input ${nameError ? 'input-error' : ''}`} autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} />
        </Field>
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? 'Хадгалж байна…' : 'Нэр хадгалах'}
        </button>
      </form>

      <section className="mt-12">
        <h2 className="text-xl">Холбоо барих мэдээлэл</h2>
        <p className="mt-2 text-xs leading-5 text-ash">
          Аюулгүй байдлын үүднээс имэйл, утсыг имэйлээр ирсэн нэг удаагийн кодоор баталгаажуулж байж солино.
        </p>
        <div className="mt-5 border-b border-line">
          <ContactRow label="Имэйл" value={user.email} editing={editing === 'email'} onEdit={() => setEditing('email')}>
            <ChangeEmail onDone={finish} onCancel={() => setEditing(null)} />
          </ContactRow>
          <ContactRow label="Утас" value={profile?.phone} editing={editing === 'phone'} onEdit={() => setEditing('phone')}>
            <ChangePhone onDone={finish} onCancel={() => setEditing(null)} />
          </ContactRow>
        </div>
      </section>

      <button type="button" className="btn-outline mt-12" onClick={signOut}>Гарах</button>
    </div>
  )
}
