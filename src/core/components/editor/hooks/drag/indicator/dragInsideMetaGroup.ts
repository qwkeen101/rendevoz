import { CustomElement } from '~/typings'
import { MetaStore } from '@/api/stores'

export default (element: CustomElement) => {
  if (element.type === 'metaObject' && element.cardType === 'embeded') {
    const meta = MetaStore.getCachedMetaObject(element.originId)
    if (meta?.type === 'group') {
      return true
    }
  }
  return false
}
