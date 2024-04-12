import { IWhiteboardInstance, XYPosition } from '~/typings'
import { mousePos } from '@/hooks/utils/useMousePositionRef'
import Id from '@/utils/id'
import deserializeHTML from '@/core/components/editor/plugins/transformHTML/deserializeHTML'

export default async (instance: IWhiteboardInstance, pos: XYPosition) => {
  const items = await navigator.clipboard.read()
  const coord = instance.coordOps?.transformWindowPositionToPosition({
    x: pos.x,
    y: pos.y
  })
  if (!coord) return
  for (const i of items) {
    if (i.types.includes('text/html')) {
      const html = await i.getType('text/html').then(i => i.text())
      const doc = new DOMParser().parseFromString(html, 'text/html')
      const content = doc.body.textContent
      if (!content?.length) {
        continue
      }
      const wrapper = document.createElement('div')
      Array.from(doc.body.children).forEach(n => wrapper.appendChild(n))
      doc.body.appendChild(wrapper)
      const deserialized = deserializeHTML(doc.body)
      console.log(deserialized, doc.body)
      if (deserialized?.length) {
        instance.insertNode?.({
          type: 'text',
          x: coord.x,
          y: coord.y,
          id: Id.getId(),
          content: deserialized
        })
      } else {
        instance.insertNode?.({
          type: 'text',
          x: coord.x,
          y: coord.y,
          id: Id.getId(),
          content: [{ type: 'paragraph', id: Id.getId(), children: [{ text: doc.textContent }] }]
        })
      }
      break
    }
    if (i.types.includes('text/plain')) {
      const text = await i.getType('text/plain').then(i => i.text())
      if (text) {
        if (coord) {
          instance.insertNode?.({
            type: 'text',
            x: coord.x,
            y: coord.y,
            id: Id.getId(),
            content: [{ type: 'paragraph', id: Id.getId(), children: [{ text }] }]
          })
        }
      }
      break
    }
  }
}
