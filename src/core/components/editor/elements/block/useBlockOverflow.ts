import { CustomElement } from '~/typings'
import { useMemo } from 'react'
const disableOverflowTypes = ['list-item', 'order-list-item', 'synced', 'column', 'columnList', 'code-block']
export default (element: CustomElement) => {
  return useMemo(() => {
    if (disableOverflowTypes.includes(element.type)) {
      return 'visible'
    }
    if (element.type === 'metaObject' && element.cardType === 'embeded') {
      return 'visible'
    }
    if (element.type === 'table') {
      return 'auto'
    }
    return 'visible'
  }, [element.type, element.cardType])
}
