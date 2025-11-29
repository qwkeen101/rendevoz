import { Node } from 'slate'
import { CustomElement, INote } from '~/typings'

export default (children: CustomElement[]) => {
  const record: Required<INote>['insideMetas'] = {}
  const push = (m: number, b: number) => {
    record[m] = record[m] ? (record[m].includes(b) ? record[m] : [...record[m], b]) : [b]
  }
  children.forEach(c => {
    if (c.type === 'metaObject') {
      push(c.originId, c.id)
    }
    if (c.type === 'synced') {
      push(c.originId, c.id)
    }
    Array.from(Node.elements(c)).forEach(e => {
      const ele = e[0]
      if (ele.type === 'inline-metaObject') {
        push(ele.originId, c.id)
      }
      if (ele.type === 'link') {
        if (ele.url?.startsWith('rendevoz://object/')) {
          try {
            const u = new URL(ele.url)
            const id = parseInt(u.pathname.replace('//object/', ''))
            push(id, c.id)
          } catch (e) {}
        }
      }
    })
  })
  return record
}
