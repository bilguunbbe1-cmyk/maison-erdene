// The store's contact details, in one place. Maison Erdene is a made-up brand
// for a course project, so these are sample values: replace them with real ones.
export const CONTACT = {
  phone: '7700-1755',
  phoneHref: 'tel:+97677001755',
  email: 'help@maison-erdene.mn',
  address: 'Улаанбаатар, Сүхбаатар дүүрэг, 1-р хороо, Энхтайваны өргөн чөлөө 15',
  hours: [
    ['Даваа – Баасан', '10:00 – 20:00'],
    ['Бямба – Ням', '11:00 – 18:00'],
  ],
}

export const SUPPORT_TOPICS = [
  { value: 'order', label: 'Захиалга, хүргэлт' },
  { value: 'product', label: 'Бүтээгдэхүүн' },
  { value: 'certificate', label: 'Баталгааны гэрчилгээ' },
  { value: 'payment', label: 'Төлбөр' },
  { value: 'other', label: 'Бусад' },
]

export const topicLabel = (value) => SUPPORT_TOPICS.find((topic) => topic.value === value)?.label ?? value
