import { CustomElement } from '~/typings'
import { EditorTypeToElementMap } from '@/core/components/editor/maps'

export default (ele: CustomElement) => {
  const inlineElementTypeSet = new Set(
    Array.from(EditorTypeToElementMap.values())
      .filter(i => i.isInline)
      .map(i => i.type)
  )
  if (inlineElementTypeSet.has(ele.type)) return true
  switch (ele.type) {
    case 'emoji':
    case 'link':
    case 'sup':
    case 'inline-metaObject':
    case 'math':
      return true
    default:
      return false
  }
}
