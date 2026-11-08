const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

export const formatPrice = (value) => money.format(Number(value))

// Written by hand because not every browser ships a Mongolian date locale.
export function formatDate(value, withTime = false) {
  const d = new Date(value)
  const pad = (n) => String(n).padStart(2, '0')
  const date = `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`
  return withTime ? `${date} ${pad(d.getHours())}:${pad(d.getMinutes())}` : date
}

export const ORDER_STATUS = {
  pending: { label: 'Хүлээгдэж буй', className: 'border-gold text-gold-dark' },
  paid: { label: 'Төлөгдсөн', className: 'border-ok text-ok' },
  shipped: { label: 'Хүргэлтэд гарсан', className: 'border-ink text-ink' },
  delivered: { label: 'Хүргэгдсэн', className: 'border-ink bg-ink text-ivory' },
  cancelled: { label: 'Цуцлагдсан', className: 'border-danger text-danger' },
}

// The seed data's drawn placeholders live under /bags/. Once a bag has a real
// photo, its drawings would look out of place next to it, so they are left out.
const isDrawing = (image) => image.url.startsWith('/bags/')

// A bag's images in display order: photos only if it has any, else its drawings.
export function productImages(product) {
  const images = [...(product?.product_images ?? [])].sort((a, b) => a.position - b.position)
  const photos = images.filter((image) => !isDrawing(image))
  return photos.length > 0 ? photos : images
}

// Picks the first image to show. Returns null when a bag has none yet.
export function mainImage(product) {
  return productImages(product)[0]?.url ?? null
}

const CYRILLIC = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'j', з: 'z', и: 'i', й: 'i',
  к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', ө: 'u', п: 'p', р: 'r', с: 's', т: 't', у: 'u',
  ү: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sh', ъ: '', ы: 'y', ь: '', э: 'e',
  ю: 'yu', я: 'ya',
}

// Builds a URL-safe slug from a Mongolian or English name.
export function slugify(text) {
  return text
    .toLowerCase()
    .split('')
    .map((char) => CYRILLIC[char] ?? char)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// RESTRICT foreign key violation. Postgres 18 reports 23001, older versions 23503.
export const isForeignKeyError = (error) => error?.code === '23503' || error?.code === '23001'
