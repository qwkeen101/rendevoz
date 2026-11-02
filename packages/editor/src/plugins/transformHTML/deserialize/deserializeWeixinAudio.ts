import { jsx } from 'slate-hyperscript'
import Id from './utils/id'

export default (node: HTMLElement) => {
  const name = node.getAttribute('name')
  const id = node.getAttribute('voice_encode_fileid')
  console.log(name, id, node)
  if (id) {
    const c = []
    if (name) {
      c.push({
        type: 'paragraph',
        id: Id.getId(),
        children: [{ text: name }]
      })
    }
    c.push({
      type: 'audio',
      url: `https://res.wx.qq.com/voice/getvoice?mediaid=${id}`,
      children: [{ text: '' }],
      id: Id.getId()
    })
    console.log(c)
    return jsx('fragment', {}, c)
  }
}
