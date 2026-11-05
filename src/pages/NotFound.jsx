import { EmptyState } from '../components/ui.jsx'

export default function NotFound() {
  return (
    <EmptyState
      title="Хуудас олдсонгүй"
      text="Таны хайсан хуудас байхгүй эсвэл зөөгдсөн байна."
      action={{ to: '/', label: 'Нүүр хуудас' }}
    />
  )
}
