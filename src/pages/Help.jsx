import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { supabase, unwrap } from '../lib/supabase.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useFetch } from '../hooks/useFetch.js'
import { email, required, validate } from '../lib/validation.js'
import { CONTACT, SUPPORT_TOPICS, topicLabel } from '../lib/contact.js'
import { formatDate } from '../lib/format.js'
import { Field } from '../components/ui.jsx'

const FAQ = [
  [
    'Захиалга хэзээ хүргэгдэх вэ?',
    'Улаанбаатар хотод төлбөр баталгаажсанаас хойш 1–2 ажлын өдөрт, орон нутагт 3–5 ажлын өдөрт хүргэнэ. Захиалгын төлөвийг «Миний захиалга» хэсгээс харна.',
  ],
  [
    'Баталгааны гэрчилгээг хаанаас авах вэ?',
    'Төлбөр баталгаажмагц цүнх бүрд давтагдашгүй сериал дугаар автоматаар олгогдож, захиалгын дэлгэрэнгүй хуудсанд харагдана.',
  ],
  [
    'Цүнх жинхэнэ эсэхийг яаж шалгах вэ?',
    'Баталгаа шалгах хуудсанд сериал дугаарыг оруулахад хэн ч шалгаж болно. Худалдан авагчийн хувийн мэдээлэл харагдахгүй.',
  ],
  [
    'Буцаах, солих боломжтой юу?',
    'Хэрэглээгүй, шошго, гэрчилгээ нь бүрэн цүнхийг хүлээн авснаас хойш 14 хоногийн дотор буцааж болно. Доорх формоор хүсэлтээ илгээнэ үү.',
  ],
  [
    'Утас, имэйлээ яаж солих вэ?',
    'Миний бүртгэл хэсгээс солино. Аюулгүй байдлын үүднээс имэйл рүү чинь илгээсэн нэг удаагийн кодыг оруулсны дараа л өөрчлөгдөнө.',
  ],
]

function ContactCard({ label, children }) {
  return (
    <div className="border-t border-line py-5">
      <p className="eyebrow">{label}</p>
      <div className="mt-2 text-sm leading-6">{children}</div>
    </div>
  )
}

function MyRequests({ version }) {
  const { user } = useAuth()
  const { data } = useFetch(
    () =>
      unwrap(
        supabase
          .from('support_requests')
          .select('id, topic, message, status, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10),
      ),
    [user.id, version],
  )
  if (!data || data.length === 0) return null

  return (
    <section className="mt-16">
      <h2 className="text-2xl">Миний хүсэлтүүд</h2>
      <ul className="mt-5 divide-y divide-line border-y border-line">
        {data.map((request) => (
          <li key={request.id} className="flex flex-wrap items-start justify-between gap-3 py-4 text-sm">
            <div className="min-w-0 flex-1">
              <p>{topicLabel(request.topic)} <span className="text-ash">· {formatDate(request.created_at, true)}</span></p>
              <p className="mt-1 line-clamp-2 text-ash">{request.message}</p>
            </div>
            <span className={`border px-2 py-0.5 text-xs ${request.status === 'open' ? 'border-gold text-gold-dark' : 'border-ok text-ok'}`}>
              {request.status === 'open' ? 'Хүлээгдэж буй' : 'Шийдвэрлэсэн'}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

const EMPTY = { name: '', email: '', topic: 'order', message: '' }

export default function Help() {
  const { user, profile } = useAuth()
  const [values, setValues] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [version, setVersion] = useState(0)

  // Signed-in customers do not have to type their name and email again.
  useEffect(() => {
    if (user) setValues((current) => ({ ...current, name: current.name || profile?.full_name || '', email: current.email || user.email }))
  }, [user, profile])

  const update = (field) => (event) => setValues({ ...values, [field]: event.target.value })

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = validate(values, {
      name: [required],
      email: [required, email],
      message: [required, (value) => (value.trim().length >= 10 ? '' : 'Дор хаяж 10 тэмдэгт бичнэ үү.')],
    })
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setBusy(true)
    try {
      // No .select() afterwards: guests may send a request but not read it back.
      await unwrap(
        supabase.from('support_requests').insert({
          user_id: user?.id ?? null,
          name: values.name.trim(),
          email: values.email.trim(),
          topic: values.topic,
          message: values.message.trim(),
        }),
      )
      setSent(true)
      setValues({ ...values, message: '' })
      setVersion((value) => value + 1)
    } catch (sendError) {
      toast.error(sendError.message.includes('Хэт олон') ? sendError.message : 'Илгээж чадсангүй. Дахин оролдоно уу.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="container-page py-12 lg:py-16">
      <p className="eyebrow">Үйлчилгээ</p>
      <h1 className="mt-3 text-3xl sm:text-4xl">Тусламжийн төв</h1>
      <p className="mt-4 max-w-xl text-sm leading-7 text-ash">
        Захиалга, гэрчилгээ, төлбөртэй холбоотой асуулт байвал бидэнтэй холбогдоорой. Хүсэлтэд ажлын нэг өдөрт хариулна.
      </p>

      <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
        <div>
          <ContactCard label="Утас">
            <a href={CONTACT.phoneHref} className="link">{CONTACT.phone}</a>
          </ContactCard>
          <ContactCard label="Имэйл">
            <a href={`mailto:${CONTACT.email}`} className="link">{CONTACT.email}</a>
          </ContactCard>
          <ContactCard label="Шоурум">{CONTACT.address}</ContactCard>
          <ContactCard label="Ажлын цаг">
            <dl>
              {CONTACT.hours.map(([days, time]) => (
                <div key={days} className="flex justify-between gap-4">
                  <dt className="text-ash">{days}</dt>
                  <dd>{time}</dd>
                </div>
              ))}
            </dl>
          </ContactCard>
          <ContactCard label="Баталгаа">
            Цүнхний сериал дугаарыг <Link to="/verify" className="link">эндээс</Link> шалгана.
          </ContactCard>
        </div>

        <section aria-labelledby="help-form-title" className="bg-sand p-6 sm:p-10">
          <h2 id="help-form-title" className="text-2xl">Хүсэлт илгээх</h2>
          {sent && (
            <p className="mt-4 border border-ok bg-white px-4 py-3 text-sm text-ok" role="status">
              Хүсэлт тань хүлээн авагдлаа. Бид {values.email} хаягаар холбогдоно.
            </p>
          )}
          <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Нэр" error={errors.name}>
                <input className={`input bg-white ${errors.name ? 'input-error' : ''}`} autoComplete="name" value={values.name} onChange={update('name')} />
              </Field>
              <Field label="Имэйл" error={errors.email}>
                <input type="email" className={`input bg-white ${errors.email ? 'input-error' : ''}`} autoComplete="email" value={values.email} onChange={update('email')} />
              </Field>
            </div>
            <Field label="Сэдэв">
              <select className="input bg-white" value={values.topic} onChange={update('topic')}>
                {SUPPORT_TOPICS.map((topic) => (
                  <option key={topic.value} value={topic.value}>{topic.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Мессеж" error={errors.message} hint="Захиалгын дугаар байвал бичээрэй.">
              <textarea rows={5} maxLength={2000} className={`input bg-white ${errors.message ? 'input-error' : ''}`} value={values.message} onChange={update('message')} />
            </Field>
            <button type="submit" className="btn-primary w-full sm:w-auto" disabled={busy}>
              {busy ? 'Илгээж байна…' : 'Илгээх'}
            </button>
          </form>
        </section>
      </div>

      <section className="mt-20 max-w-3xl">
        <h2 className="text-2xl">Түгээмэл асуулт</h2>
        <div className="mt-5 divide-y divide-line border-y border-line">
          {FAQ.map(([question, answer]) => (
            <details key={question} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm">
                {question}
                <span className="text-lg leading-none text-ash transition-transform group-open:rotate-45" aria-hidden="true">+</span>
              </summary>
              <p className="mt-3 text-sm leading-7 text-ash">{answer}</p>
            </details>
          ))}
        </div>
      </section>

      {user && <MyRequests version={version} />}
    </div>
  )
}
