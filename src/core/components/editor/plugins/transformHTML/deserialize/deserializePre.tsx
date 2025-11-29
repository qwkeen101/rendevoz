import { jsx } from 'slate-hyperscript'
import Id from '@/utils/id'
import wrapElementText from '@/core/components/editor/plugins/transformHTML/deserialize/wrapElementText'

const ignoreCode = new Set(['code'])
export default (node: HTMLElement) => {
  const text = node.innerText
  if (text.length) {
    return jsx(
      'element',
      { type: 'code-block', id: Id.getId(), language: 'plain text' },
      wrapElementText(node, {
        ignoreAttributes: ignoreCode
      })
    )
  }
}
