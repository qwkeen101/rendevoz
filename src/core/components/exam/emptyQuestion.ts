import { IExamQuestion } from '~/typings'
import produce from 'immer'
import { Node } from 'slate'

export default (question: IExamQuestion) => {
  return produce(question, draft => {
    switch (draft.type) {
      case 'number':
      case 'text':
      case 'date':
      case 'trueOrFalse':
        draft.value = undefined
        break
      case 'multiSelect':
      case 'singleSelect':
        draft.choices.forEach(i => (i.value = undefined))
        break
      case 'imageOcclusion':
        draft.content.forEach(i => (i.value = undefined))
        break
      case 'cloze':
        Array.from(Node.elements({ children: draft.content || [] })).forEach(i => {
          const n = i[0]
          if (n.type === 'cloze') {
            n.value = undefined
          }
          if (n.type === 'select') {
            n.content.forEach(c => {
              c.value = undefined
            })
          }
        })
        break
    }
  })
}
