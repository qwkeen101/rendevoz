import { ObjectStore } from '@/api/stores/index'
import { IQuestion } from '~/typings'

const QuestionStore = {
  resetQuestionType: async (id: number, type: IQuestion['questionType']) => {
    const q = await ObjectStore('question').getOneById(id)
    if (q) {
      if (type === q.questionType) return
      switch (type) {
        case 'text': {
          ObjectStore('question').updateOne({ id, sAnswer: '', answer: '', questionType: 'text' })
          break
        }
        case 'cloze': {
          ObjectStore('question').updateOne({ id, answer: '', questionType: 'cloze' })
          break
        }
        case 'multiSelect': {
          ObjectStore('question').updateOne({
            id,
            sAnswer: undefined,
            answer: undefined,
            choices: q.questionType === 'singleSelect' ? q.choices : [],
            questionType: 'multiSelect'
          })
          break
        }
        case 'singleSelect': {
          ObjectStore('question').updateOne({
            id,
            sAnswer: undefined,
            answer: undefined,
            choices: q.questionType === 'multiSelect' ? q.choices : [],
            questionType: 'singleSelect'
          })
          break
        }
        case 'trueOrFalse': {
          ObjectStore('question').updateOne({ id, sAnswer: undefined, answer: undefined, questionType: 'trueOrFalse' })
          break
        }
      }
    }
  }
}

export default QuestionStore
