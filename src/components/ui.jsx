import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ORDER_STATUS } from '../lib/format.js'

export function Spinner({ className = '' }) {
  return (
    <span
      role="status"
      aria-label="Ачаалж байна"
      className={`inline-block size-5 animate-spin rounded-full border border-line border-t-ink ${className}`}
    />
  )
}

export function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Spinner className="size-7" />
    </div>
  )
}

export function EmptyState({ title, text, action }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
      <h2 className="text-3xl">{title}</h2>
      {text && <p className="mt-3 text-sm leading-6 text-ash">{text}</p>}
      {action && (
        <Link to={action.to} className="btn-outline mt-7">
          {action.label}
        </Link>
      )}
    </div>
  )
}

export function ErrorState({ onRetry }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center" role="alert">
      <h2 className="text-3xl">Алдаа гарлаа</h2>
      <p className="mt-3 text-sm leading-6 text-ash">
        Мэдээллийг ачаалж чадсангүй. Интернэт холболтоо шалгаад дахин оролдоно уу.
      </p>
      {onRetry && (
        <button type="button" className="btn-outline mt-7" onClick={onRetry}>
          Дахин оролдох
        </button>
      )}
    </div>
  )
}

export function Field({ label, error, hint, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-medium text-ash">{label}</span>
      {children}
      {hint && !error && <span className="mt-1.5 block text-xs text-ash">{hint}</span>}
      {error && (
        <span className="mt-1.5 block text-xs text-danger" role="alert">
          {error}
        </span>
      )}
    </label>
  )
}

export function StatusBadge({ status }) {
  const config = ORDER_STATUS[status]
  return (
    <span className={`inline-block whitespace-nowrap border px-2.5 py-1 text-[11px] ${config.className}`}>
      {config.label}
    </span>
  )
}

// Uses the native <dialog>, which traps focus and closes on Esc for free.
export function ConfirmDialog({ open, title, text, confirmLabel = 'Устгах', busy, onConfirm, onCancel }) {
  const ref = useRef(null)

  useEffect(() => {
    const dialog = ref.current
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onCancel={onCancel}
      className="m-auto w-[calc(100%-2rem)] max-w-md bg-ivory p-8 text-ink backdrop:bg-ink/50"
    >
      <h2 className="text-2xl">{title}</h2>
      {text && <p className="mt-3 text-sm leading-6 text-ash">{text}</p>}
      <div className="mt-7 flex flex-wrap justify-end gap-3">
        <button type="button" className="btn-outline btn-sm" onClick={onCancel} disabled={busy}>
          Болих
        </button>
        <button type="button" className="btn-danger btn-sm" onClick={onConfirm} disabled={busy}>
          {busy ? 'Түр хүлээнэ үү…' : confirmLabel}
        </button>
      </div>
    </dialog>
  )
}

export function Pagination({ page, pageCount, onChange }) {
  if (pageCount <= 1) return null
  return (
    <nav className="mt-12 flex items-center justify-center gap-5" aria-label="Хуудас">
      <button
        type="button"
        className="btn-outline btn-sm"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        Өмнөх
      </button>
      <span className="text-xs text-ash">
        {page} / {pageCount}
      </span>
      <button
        type="button"
        className="btn-outline btn-sm"
        disabled={page >= pageCount}
        onClick={() => onChange(page + 1)}
      >
        Дараах
      </button>
    </nav>
  )
}

const ICONS = {
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  heart: <path d="M12 20s-7.5-4.6-9-9.2C2 7.4 4.2 5 7 5c2 0 3.8 1.1 5 3 1.2-1.9 3-3 5-3 2.8 0 5 2.4 4 5.8C19.500 15.400 12 20 12 20Z" />,
  bag: <><path d="M5 8h14l1 13H4L5 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4.500 4-6 8-6s7 1.500 8 6" /></>,
  menu: <path d="M3 7h18M3 12h18M3 17h18" />,
  close: <path d="M5 5l14 14M19 5 5 19" />,
}

export function Icon({ name, filled = false, className = 'size-5' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {ICONS[name]}
    </svg>
  )
}
