// Each validator returns an error message, or '' when the value is fine.

export const required = (value) => (String(value ?? '').trim() ? '' : 'Энэ талбарыг бөглөнө үү.')

export const email = (value) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim()) ? '' : 'Имэйл хаяг буруу байна.'

export const password = (value) =>
  String(value).length >= 8 ? '' : 'Нууц үг хамгийн багадаа 8 тэмдэгт байна.'

export const phone = (value) =>
  /^[0-9]{8}$/.test(String(value).trim()) ? '' : 'Утасны дугаар 8 оронтой байна.'

export const positiveNumber = (value) =>
  Number(value) > 0 ? '' : 'Эерэг тоо оруулна уу.'

export const wholeNumber = (value) =>
  Number.isInteger(Number(value)) && Number(value) >= 0 && String(value).trim() !== ''
    ? ''
    : '0 эсвэл түүнээс их бүхэл тоо оруулна уу.'

export const slug = (value) =>
  /^[a-z0-9-]+$/.test(value) ? '' : 'Зөвхөн латин жижиг үсэг, тоо, зураас ашиглана.'

// rules: { fieldName: [validator, ...] }. Returns only the fields with errors.
export function validate(values, rules) {
  const errors = {}
  for (const [field, validators] of Object.entries(rules)) {
    for (const check of validators) {
      const message = check(values[field])
      if (message) {
        errors[field] = message
        break
      }
    }
  }
  return errors
}

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export function imageFileError(file) {
  if (!IMAGE_TYPES.includes(file.type)) return `${file.name}: зөвхөн JPG, PNG, WEBP зураг оруулна.`
  if (file.size > MAX_IMAGE_BYTES) return `${file.name}: файлын хэмжээ 5 MB-аас их байна.`
  return ''
}
