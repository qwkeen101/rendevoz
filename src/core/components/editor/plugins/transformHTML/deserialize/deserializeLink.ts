import deserializeMedia from '@/core/components/editor/plugins/transformHTML/deserialize/deserializeMedia'
import wrapElementText from '@/core/components/editor/plugins/transformHTML/deserialize/wrapElementText'
import { jsx } from 'slate-hyperscript'
import Id from '@/utils/id'

export default (node: HTMLAnchorElement) => {
  if (node.querySelector('img')) {
    const image = node.querySelector('img')
    return deserializeMedia(image)
  }
  const url = node.getAttribute('href')
  if (url) {
    const children = wrapElementText(node)
    return jsx(
      'element',
      {
        type: 'link',
        id: Id.getId(),
        url
      },
      children
    )
  }
  return null
}
