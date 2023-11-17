import { Rendevoz } from '@/core/rendevoz'
import { DateFormat } from '@/utils'

const DisplayCell = ({ value, type }: { value: any; type: 'type' | 'createdAt' | 'viewAt' | 'updatedAt' }) => {
  if (!value) return null
  const displayed = () => {
    switch (type) {
      case 'type':
        return Rendevoz.Utils.Meta.getTypeName(value)
      case 'viewAt':
      case 'createdAt':
      case 'updatedAt':
        return DateFormat.format(value, DateFormat.Formats.withMinute)
    }
  }
  return displayed()
}

export default DisplayCell
