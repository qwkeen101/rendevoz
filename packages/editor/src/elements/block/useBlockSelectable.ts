import { CustomElement } from '~/typings'
import { useMemo } from 'react'
import { MetaStore } from '@/api/stores'

export default (element: CustomElement) => {
  return useMemo(() => {
    let selectable = true
    if (['table', 'iframe', 'image'].includes(element.type)) {
      selectable = false
    }
    if (element.type === 'metaObject' && element.cardType === 'embeded') {
      const isGroup = MetaStore.getMetaObjectsMap().get(element.originId)?.type === 'group'
      if (isGroup) {
        selectable = false
      }
    }
    return selectable
  }, [element])
}
