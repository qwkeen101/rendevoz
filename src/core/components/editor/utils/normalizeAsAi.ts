import { Descendant, Node } from 'slate'

export default (value: Descendant[]) => {
  return value
    .map(i => ({
      id: i.id,
      text: Node.string(i)
    }))
    .filter(i => i.text.length > 0)
}
