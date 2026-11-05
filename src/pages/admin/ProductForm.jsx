import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { supabase, unwrap } from '../../lib/supabase.js'
import { useFetch } from '../../hooks/useFetch.js'
import { ErrorState, Field, PageLoader } from '../../components/ui.jsx'
import { slugify } from '../../lib/format.js'
import {
  imageFileError,
  IMAGE_TYPES,
  positiveNumber,
  required,
  slug as slugRule,
  validate,
  wholeNumber,
} from '../../lib/validation.js'

const BUCKET = 'product-images'
const EMPTY = {
  name: '', slug: '', category_id: '', description: '', material: '', color: '',
  dimensions: '', price: '', stock: '0', is_active: true,
}

async function fetchFormData(id) {
  const [categories, collections, product] = await Promise.all([
    unwrap(supabase.from('categories').select('id, name').order('id')),
    unwrap(supabase.from('collections').select('id, name').order('id')),
    id
      ? unwrap(
          supabase
            .from('products')
            .select('*, product_images(id, url, storage_path, position), product_collections(collection_id)')
            .eq('id', id)
            .maybeSingle(),
        )
      : null,
  ])
  return { categories, collections, product }
}

export default function ProductForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, loading, error, reload } = useFetch(() => fetchFormData(id), [id])

  const [values, setValues] = useState(EMPTY)
  const [collectionIds, setCollectionIds] = useState([])
  const [slugEdited, setSlugEdited] = useState(Boolean(id))
  const [savedImages, setSavedImages] = useState([]) // rows already in the database
  const [removedImages, setRemovedImages] = useState([]) // removed, not saved yet
  const [newFiles, setNewFiles] = useState([]) // { file, preview } waiting to upload
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const product = data?.product
    if (!product) return
    setValues({
      name: product.name,
      slug: product.slug,
      category_id: String(product.category_id),
      description: product.description,
      material: product.material,
      color: product.color,
      dimensions: product.dimensions,
      price: String(product.price),
      stock: String(product.stock),
      is_active: product.is_active,
    })
    setCollectionIds(product.product_collections.map((row) => row.collection_id))
    setSavedImages([...product.product_images].sort((a, b) => a.position - b.position))
  }, [data])

  // Object URLs use memory until released, so release them when the page closes.
  // A ref is needed because this cleanup would otherwise see only the first render's list.
  const filesRef = useRef(newFiles)
  filesRef.current = newFiles
  useEffect(() => () => filesRef.current.forEach((item) => URL.revokeObjectURL(item.preview)), [])

  const update = (field) => (event) => {
    const next = { ...values, [field]: event.target.value }
    if (field === 'name' && !slugEdited) next.slug = slugify(event.target.value)
    if (field === 'slug') setSlugEdited(true)
    setValues(next)
  }

  const toggleCollection = (collectionId) =>
    setCollectionIds((current) =>
      current.includes(collectionId)
        ? current.filter((value) => value !== collectionId)
        : [...current, collectionId],
    )

  const handleFiles = (event) => {
    const accepted = []
    for (const file of event.target.files) {
      const message = imageFileError(file)
      if (message) toast.error(message)
      else accepted.push({ file, preview: URL.createObjectURL(file) })
    }
    setNewFiles((current) => [...current, ...accepted])
    event.target.value = '' // lets the same file be picked again after removing it
  }

  const removeNewFile = (target) => {
    URL.revokeObjectURL(target.preview)
    setNewFiles((current) => current.filter((item) => item !== target))
  }

  const removeSavedImage = (target) => {
    setSavedImages((current) => current.filter((image) => image.id !== target.id))
    setRemovedImages((current) => [...current, target])
  }

  const uploadNewImages = async (productId) => {
    const rows = []
    let position = savedImages.length
    for (const { file } of newFiles) {
      const extension = file.name.split('.').pop().toLowerCase()
      const path = `${productId}/${crypto.randomUUID()}.${extension}`
      await unwrap(supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type }))
      const { data: publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(path)
      rows.push({ product_id: productId, url: publicUrl.publicUrl, storage_path: path, position })
      position += 1
    }
    if (rows.length > 0) await unwrap(supabase.from('product_images').insert(rows))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = validate(values, {
      name: [required],
      slug: [required, slugRule],
      category_id: [required],
      price: [required, positiveNumber],
      stock: [wholeNumber],
    })
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      toast.error('Формыг шалгана уу.')
      return
    }

    const payload = {
      ...values,
      name: values.name.trim(),
      category_id: Number(values.category_id),
      price: Number(values.price),
      stock: Number(values.stock),
    }

    setBusy(true)
    try {
      let productId = Number(id)
      if (id) {
        await unwrap(supabase.from('products').update(payload).eq('id', id))
      } else {
        const created = await unwrap(supabase.from('products').insert(payload).select('id').single())
        productId = created.id
      }

      // N:M sync: replace all of this bag's collection links with the current choice.
      await unwrap(supabase.from('product_collections').delete().eq('product_id', productId))
      if (collectionIds.length > 0) {
        await unwrap(
          supabase.from('product_collections').insert(
            collectionIds.map((collection_id) => ({ product_id: productId, collection_id })),
          ),
        )
      }

      if (removedImages.length > 0) {
        await unwrap(supabase.from('product_images').delete().in('id', removedImages.map((image) => image.id)))
        const paths = removedImages.map((image) => image.storage_path).filter(Boolean)
        if (paths.length > 0) await supabase.storage.from(BUCKET).remove(paths)
      }

      await uploadNewImages(productId)

      toast.success('Хадгалагдлаа')
      navigate('/admin/products')
    } catch (saveError) {
      // 23505 = unique violation. Only slug is unique among the fields on this form.
      if (saveError.code === '23505') {
        setErrors({ slug: 'Энэ холбоос аль хэдийн ашиглагдсан байна.' })
        toast.error('Холбоос давхардсан байна.')
      } else {
        toast.error('Хадгалж чадсангүй. Дахин оролдоно уу.')
      }
      setBusy(false)
    }
  }

  if (error) return <ErrorState onRetry={reload} />
  if (loading) return <PageLoader />
  if (id && !data.product) return <ErrorState />

  return (
    <>
      <Link to="/admin/products" className="link text-xs text-ash">← Бүтээгдэхүүн</Link>
      <h1 className="mt-4 text-4xl">{id ? 'Бүтээгдэхүүн засах' : 'Шинэ бүтээгдэхүүн'}</h1>

      <form onSubmit={handleSubmit} noValidate className="mt-8 grid max-w-5xl gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Нэр" error={errors.name}>
              <input className={`input ${errors.name ? 'input-error' : ''}`} value={values.name} onChange={update('name')} />
            </Field>
            <Field label="Холбоос (slug)" error={errors.slug}>
              <input className={`input ${errors.slug ? 'input-error' : ''}`} value={values.slug} onChange={update('slug')} />
            </Field>
            <Field label="Ангилал" error={errors.category_id}>
              <select className={`input ${errors.category_id ? 'input-error' : ''}`} value={values.category_id} onChange={update('category_id')}>
                <option value="">Сонгох…</option>
                {data.categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-5">
              <Field label="Үнэ ($)" error={errors.price}>
                <input type="number" min="0" step="0.01" className={`input ${errors.price ? 'input-error' : ''}`} value={values.price} onChange={update('price')} />
              </Field>
              <Field label="Үлдэгдэл" error={errors.stock}>
                <input type="number" min="0" step="1" className={`input ${errors.stock ? 'input-error' : ''}`} value={values.stock} onChange={update('stock')} />
              </Field>
            </div>
          </div>
          <Field label="Тайлбар">
            <textarea rows={4} className="input py-3" value={values.description} onChange={update('description')} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="Материал">
              <input className="input" value={values.material} onChange={update('material')} />
            </Field>
            <Field label="Өнгө">
              <input className="input" value={values.color} onChange={update('color')} />
            </Field>
            <Field label="Хэмжээ">
              <input className="input" value={values.dimensions} onChange={update('dimensions')} />
            </Field>
          </div>

          <fieldset>
            <legend className="mb-2 text-xs font-medium text-ash">Цуглуулга</legend>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {data.collections.map((collection) => (
                <label key={collection.id} className="flex cursor-pointer items-center gap-2 text-sm">
                  <input type="checkbox" className="size-4 accent-ink" checked={collectionIds.includes(collection.id)} onChange={() => toggleCollection(collection.id)} />
                  {collection.name}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" className="size-4 accent-ink" checked={values.is_active} onChange={(event) => setValues({ ...values, is_active: event.target.checked })} />
            Дэлгүүрт харуулах
          </label>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-ash">Зураг</p>
          <div className="grid grid-cols-3 gap-2">
            {savedImages.map((image) => (
              <Thumbnail key={image.id} src={image.url} onRemove={() => removeSavedImage(image)} />
            ))}
            {newFiles.map((item) => (
              <Thumbnail key={item.preview} src={item.preview} isNew onRemove={() => removeNewFile(item)} />
            ))}
          </div>
          <label className="btn-outline btn-sm mt-3 w-full">
            Зураг сонгох
            <input type="file" multiple accept={IMAGE_TYPES.join(',')} className="sr-only" onChange={handleFiles} />
          </label>
          <p className="mt-2 text-xs text-ash">JPG, PNG, WEBP · хамгийн ихдээ 5 MB</p>

          <button type="submit" className="btn-primary mt-8 w-full" disabled={busy}>
            {busy ? 'Хадгалж байна…' : 'Хадгалах'}
          </button>
        </div>
      </form>
    </>
  )
}

function Thumbnail({ src, isNew, onRemove }) {
  return (
    <div className="relative aspect-square bg-sand">
      <img src={src} alt="" className="size-full object-cover" />
      {isNew && <span className="absolute bottom-0 left-0 bg-ink px-1.5 text-[10px] text-ivory">Шинэ</span>}
      <button type="button" aria-label="Зураг хасах" onClick={onRemove} className="absolute top-0 right-0 size-6 cursor-pointer bg-ink/80 text-xs text-ivory hover:bg-danger">✕</button>
    </div>
  )
}
