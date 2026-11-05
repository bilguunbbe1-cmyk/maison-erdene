import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase, unwrap } from '../lib/supabase.js'
import { formatDate } from '../lib/format.js'

// Public page, the main thing that sets this shop apart. Anyone can check a serial,
// such as someone buying a used bag. It goes through a function that returns the
// bag's details only, never the buyer's.
export default function Verify() {
  const [params, setParams] = useSearchParams()
  const initial = params.get('serial') ?? ''
  const [serial, setSerial] = useState(initial)
  const [status, setStatus] = useState(initial ? 'loading' : 'idle') // idle | loading | found | notfound | error
  const [result, setResult] = useState(null)

  useEffect(() => {
    if (!initial) return
    let active = true
    setStatus('loading')
    unwrap(supabase.rpc('verify_certificate', { p_serial: initial }))
      .then((rows) => {
        if (!active) return
        setResult(rows[0] ?? null)
        setStatus(rows[0] ? 'found' : 'notfound')
      })
      .catch(() => active && setStatus('error'))
    return () => {
      active = false
    }
  }, [initial])

  const handleSubmit = (event) => {
    event.preventDefault()
    const value = serial.trim()
    if (value) setParams({ serial: value })
  }

  return (
    <div className="container-page max-w-2xl py-16 text-center">
      <p className="eyebrow">Баталгаа шалгах</p>
      <h1 className="mt-3 text-5xl">Таны цүнх жинхэнэ үү?</h1>
      <p className="mt-4 text-sm leading-6 text-ash">
        Гэрчилгээн дээрх сериал дугаарыг оруулж шалгана уу.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3 sm:flex-row">
        <input
          className="input flex-1 text-center tracking-wider uppercase sm:text-left"
          placeholder="ME-2026-XXXXXXXXXX"
          aria-label="Сериал дугаар"
          value={serial}
          onChange={(event) => setSerial(event.target.value)}
        />
        <button type="submit" className="btn-primary" disabled={!serial.trim() || status === 'loading'}>
          {status === 'loading' ? 'Шалгаж байна…' : 'Шалгах'}
        </button>
      </form>

      <div aria-live="polite">
        {status === 'found' && (
          <div className="mt-10 border border-ok p-7 text-left sm:flex sm:items-center sm:gap-7">
            {result.image_url && (
              <img src={result.image_url} alt="" className="mx-auto mb-5 size-28 bg-sand object-cover sm:mb-0 sm:size-36" />
            )}
            <div>
              <p className="text-xs font-medium text-ok">✓ Жинхэнэ Maison Erdene бүтээгдэхүүн</p>
              <h2 className="mt-2 text-3xl">
                <Link to={`/products/${result.product_slug}`} className="link">{result.product_name}</Link>
              </h2>
              <p className="mt-2 text-xs text-ash">Сериал: {result.serial}</p>
              <p className="mt-1 text-xs text-ash">Олгосон огноо: {formatDate(result.issued_at)}</p>
            </div>
          </div>
        )}
        {status === 'notfound' && (
          <div className="mt-10 border border-danger p-7" role="alert">
            <p className="text-sm font-medium text-danger">✕ Энэ дугаар бүртгэлгүй байна</p>
            <p className="mt-2 text-xs leading-6 text-ash">
              Дугаараа дахин шалгана уу. Бүртгэлгүй бол тухайн цүнх манайх биш байх магадлалтай.
            </p>
          </div>
        )}
        {status === 'error' && (
          <p className="mt-10 text-sm text-danger" role="alert">Шалгаж чадсангүй. Дахин оролдоно уу.</p>
        )}
      </div>
    </div>
  )
}
