import { CustomElement } from '~/typings'
import { Node, Text } from 'slate'
import { MetaStore } from '@/api/stores'

export default function normalizeElementToText(element: CustomElement): string {
  if (element.type === 'metaObject' || element.type === 'inline-metaObject') {
    const m = MetaStore.getCachedMetaObject(element.originId)
    if (m) {
      return m.name || m.placeholderName || ''
    }
    return ''
  }
  if (Text.isText(element)) {
    return element.text
  } else {
    return element.children.map(normalizeElementToText).join('')
  }
}
