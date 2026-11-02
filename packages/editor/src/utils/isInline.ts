import { CustomElement } from '~/typings'
import EditorElements from '../elements/EditorElements'

const inlineKeys = new Set([
  ...Object.values(EditorElements)
    .filter(i => i.isInline)
    .map(i => i.type),
  'inlne-image',
  'inline-metapicker'
])
export default (ele: CustomElement | string) => {
  return inlineKeys.has(typeof ele === 'string' ? ele : ele.type)
}
