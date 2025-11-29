import { IExamQuestion } from '~/typings'
import { Node } from 'slate'

export default (q: IExamQuestion) => {
  switch (q.type) {
    case 'text':
      return q.answer && q.answer === q.value
    case 'date': {
      if (q.answer && q.value) {
        const parsedAnswer = new Date(q.answer)
        const parsedValue = new Date(q.value)
        if (!isNaN(parsedAnswer.getTime()) && !isNaN(parsedValue.getTime())) {
          if (
            parsedValue.getFullYear() === parsedAnswer.getFullYear() &&
            parsedValue.getMonth() === parsedAnswer.getMonth() &&
            parsedValue.getDate() === parsedAnswer.getDate()
          ) {
            return true
          }
        }
      }
      return false
    }
    case 'number': {
      return q.answer !== undefined && !isNaN(Number(q.answer)) && Number(q.value) === Number(q.answer)
    }
    case 'singleSelect':
    case 'multiSelect': {
      return q.choices.filter(i => i.answer).length > 0 && q.choices.every(i => (i.answer === true ? i.answer === i.value : true))
    }
    case 'imageOcclusion': {
      return q.content.length > 0 && q.content.every(i => i.answer && i.answer === i.value)
    }
    case 'cloze': {
      const allClozes = Array.from(Node.elements({ children: q.content || [] }))
        .filter(i => i[0].type === 'cloze' || i[0].type === 'select')
        .map(i => i[0])
      return (
        allClozes.length > 0 &&
        allClozes.every(c => {
          if (c.type === 'cloze') {
            return c.answer && c.answer === c.value
          }
          if (c.type === 'select') {
            return c.content.filter(i => i.answer).length > 0 && c.content.every(i => (i.answer ? i.answer === i.value : true))
          }
          return false
        })
      )
    }
    case 'trueOrFalse': {
      return q.answer !== undefined && q.answer === q.value
    }
  }
}
