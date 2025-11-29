import { atom } from 'jotai/index'
import { IExam, IExamQuestion, IExamState } from '~/typings'
import { useAtom, useAtomValue } from 'jotai'
import { selectAtom } from 'jotai/utils'
import isQuestionCorrect from '@/core/components/exam/isQuestionCorrect'

export const ExamStateAtom = atom<IExamState>({
  mode: 'edit',
  historyVisible: false
})

export default () => useAtom(ExamStateAtom)

const ExamModeAtom = selectAtom(ExamStateAtom, s => s.mode)
const ExplainSourceAtom = selectAtom(ExamStateAtom, s => s.explainSource)
const FocusQuestionAtom = selectAtom(ExamStateAtom, s => s.currentFocusQuestionId)
export const useExamMode = () => useAtomValue(ExamModeAtom)
export const useExamExplainSource = () => useAtomValue(ExplainSourceAtom)
export const useExamFocusQuestion = () => useAtomValue(FocusQuestionAtom)
export const calculateHistoryQuestions = (history: Required<IExam>['history'], allQuestions: IExamQuestion[]) => {
  const questionMap = new Map(allQuestions.map(i => [i.id, i]))
  const result: Required<IExamState>['categorizedQuestions'] = {}
  history.forEach(h => {
    h.questions.forEach(i => {
      const target = questionMap.get(i.id)
      if (target) {
        if (target.type === 'description') return
        const resultQuestion = result[i.id] || {
          question: target,
          historys: [],
          correct: 0,
          wrong: 0
        }
        resultQuestion.historys.push({
          historyId: h.id,
          time: h.time,
          question: i,
          name: h.title || DateFormat.format(h.time, DateFormat.Formats.withMinute)
        })
        if (isQuestionCorrect(i)) {
          resultQuestion.correct += 1
        } else {
          resultQuestion.wrong += 1
        }
        result[i.id] = resultQuestion
      }
    })
  })
  return result
}
