import deserializeMedia from '@/core/components/editor/plugins/transformHTML/deserialize/deserializeMedia'

export default (node: HTMLAnchorElement) => {
  if (node.querySelector('img')) {
    const image = node.querySelector('img')
    return deserializeMedia(image)
  }
  return
}
