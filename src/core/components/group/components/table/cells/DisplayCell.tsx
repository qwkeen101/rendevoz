import { DateFormat } from '@/utils'

const DisplayCell = ({ value, type }: { value: any; type: 'type' | 'createdAt' | 'viewAt' | 'updatedAt' | 'deletedAt' }) => {
  if (!value) return null
  const displayed = () => {
    switch (type) {
      case 'type':
        return Global.utils.getTypeName(value)
      case 'viewAt':
      case 'createdAt':
      case 'updatedAt':
      case 'deletedAt':
        return DateFormat.format(value, DateFormat.Formats.withMinute)
    }
  }
  return displayed()
}

export default DisplayCell
