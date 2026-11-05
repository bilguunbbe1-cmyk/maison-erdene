import { useState } from 'react'
import toast from 'react-hot-toast'
import { supabase, unwrap } from '../../lib/supabase.js'
import { useFetch } from '../../hooks/useFetch.js'
import { ConfirmDialog, EmptyState, ErrorState, Field, PageLoader } from '../../components/ui.jsx'
import { isForeignKeyError, slugify } from '../../lib/format.js'
import { required, slug as slugRule, validate } from '../../lib/validation.js'

const EMPTY = { id: null, name: '', slug: '' }

// One page for two tables that have the same shape: categories and collections.
export default function Taxonomy({ table, title }) {
  const { data: rows, loading, error, reload } = useFetch(
    () => unwrap(supabase.from(table).select('id, name, slug').order('id')),
    [table],
  )
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [toDelete, setToDelete] = useState(null)

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = validate(form, { name: [required], slug: [required, slugRule] })
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setBusy(true)
    try {
      const payload = { name: form.name.trim(), slug: form.slug }
      if (form.id) await unwrap(supabase.from(table).update(payload).eq('id', form.id))
      else await unwrap(supabase.from(table).insert(payload))
      toast.success('Хадгалагдлаа')
      setForm(EMPTY)
      reload()
    } catch (saveError) {
      toast.error(saveError.code === '23505' ? 'Ийм нэр эсвэл холбоос аль хэдийн байна.' : 'Хадгалж чадсангүй.')
    } finally {
      setBusy(false)
    }
  }

  const confirmDelete = async () => {
    setBusy(true)
    try {
      await unwrap(supabase.from(table).delete().eq('id', toDelete.id))
      toast.success('Устгагдлаа')
      if (form.id === toDelete.id) setForm(EMPTY)
      reload()
    } catch (deleteError) {
      toast.error(isForeignKeyError(deleteError) ? 'Энэ ангилалд бүтээгдэхүүн байгаа тул устгах боломжгүй.' : 'Устгаж чадсангүй.')
    } finally {
      setBusy(false)
      setToDelete(null)
    }
  }

  return (
    <>
      <h1 className="text-4xl">{title}</h1>

      <div className="mt-8 grid max-w-5xl gap-8 lg:grid-cols-[1fr_320px]">
        <div className="order-2 lg:order-1">
          {error ? (
            <ErrorState onRetry={reload} />
          ) : loading ? (
            <PageLoader />
          ) : rows.length === 0 ? (
            <EmptyState title="Одоогоор хоосон байна" />
          ) : (
            <div className="overflow-x-auto">
              <table className="table-admin min-w-0">
                <thead>
                  <tr><th>Нэр</th><th>Холбоос</th><th><span className="sr-only">Үйлдэл</span></th></tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.name}</td>
                      <td className="text-ash">{row.slug}</td>
                      <td className="text-right whitespace-nowrap">
                        <button type="button" className="link mr-4 text-xs" onClick={() => setForm(row)}>Засах</button>
                        <button type="button" className="link text-xs text-danger" onClick={() => setToDelete(row)}>Устгах</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} noValidate className="order-1 space-y-4 self-start border border-line p-5 lg:order-2">
          <h2 className="text-2xl">{form.id ? 'Засах' : 'Шинээр нэмэх'}</h2>
          <Field label="Нэр" error={errors.name}>
            <input
              className={`input ${errors.name ? 'input-error' : ''}`}
              value={form.name}
              onChange={(event) =>
                setForm({
                  ...form,
                  name: event.target.value,
                  // A new row's slug follows its name. An existing slug stays, so old links keep working.
                  slug: form.id ? form.slug : slugify(event.target.value),
                })
              }
            />
          </Field>
          <Field label="Холбоос (slug)" error={errors.slug}>
            <input className={`input ${errors.slug ? 'input-error' : ''}`} value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} />
          </Field>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary btn-sm flex-1" disabled={busy}>Хадгалах</button>
            {form.id && (
              <button type="button" className="btn-outline btn-sm" onClick={() => setForm(EMPTY)}>Болих</button>
            )}
          </div>
        </form>
      </div>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Устгах уу?"
        text={`«${toDelete?.name}» устана. Энэ үйлдлийг буцаах боломжгүй.`}
        busy={busy}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </>
  )
}
