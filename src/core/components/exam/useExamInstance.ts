import { atom } from 'jotai/index'
import { IExamInstance, IExamQuestion } from '~/typings'
import { useAtomValue } from 'jotai'
import { assignProperties, Id } from '@/utils'
import { ObjectStore } from '@/api/stores'
import produce from 'immer'
import { range } from 'lodash'
import isQuestionCorrect from '@/core/components/exam/isQuestionCorrect'
import emptyQuestion from '@/core/components/exam/emptyQuestion'
import useExamState from '@/core/components/exam/useExamState'

const ExamInstanceAtom = atom<IExamInstance>({})

export default () => useAtomValue(ExamInstanceAtom)

export const assignExamInstance = (i: IExamInstance, id: number) => {
  const [state, setState] = useExamState()
  assignProperties(i, {
    viewHistory: async hId => {
      const exam = await ObjectStore('exam').getOneById(id)
      const h = exam?.history?.find(i => i.id === hId)
      if (h) {
        setState(s => ({ ...s, mode: 'history', currentHistory: h }))
      }
    },
    submit: async () => {
      const exam = await ObjectStore('exam').getOneById(id)
      const questionIds = exam?.questions
      if (exam && questionIds?.length) {
        const targetHistoryId = Id.getId()
        const questions = await ObjectStore('examQuestion').getMultipleByIds(questionIds)
        await ObjectStore('exam').updateOne({
          id: exam.id,
          history: [
            {
              id: targetHistoryId,
              questions,
              time: Date.now(),
              correct: questions.filter(i => isQuestionCorrect(i)).length
            },
            ...(exam.history || [])
          ]
        })
        questions.forEach(q => {
          ObjectStore('examQuestion').updateOne(emptyQuestion(q))
        })
        i.viewHistory(targetHistoryId)
        i.scrollElementRef.current?.scrollTo(0, 0)
      }
    },
    addQuestion: async opts => {
      const initialChoices = range(0, 3).map(() => ({ id: Id.getId(), name: '' }))
      const initial = {
        type: opts.type,
        content: [],
        parentObjectId: id
      }
      if (opts.type === 'singleSelect' || opts.type === 'multiSelect') {
        Object.assign(initial, {
          choices: initialChoices
        })
      }
      const question = await ObjectStore('examQuestion').addOne(initial)

      const exam = await ObjectStore('exam').getOneById(id)
      if (exam) {
        const target = Math.max(0, opts.target ? exam.questions.indexOf(opts.target) : exam.questions.length - 1)
        if (target >= 0) {
          const finalIndex = opts.direction === 'before' ? target : target + 1
          await ObjectStore('exam').updateOne({
            id,
            questions: produce(exam.questions, draft => {
              draft.splice(finalIndex, 0, question.id)
            })
          })
        }
      }
      return question
    },
    deleteQuestion: async qId => {
      const exam = await ObjectStore('exam').getOneById(id)
      if (exam) {
        await ObjectStore('exam').updateOne({
          id,
          questions: exam.questions.filter(i => i !== qId)
        })
      }
    }
  })
}
