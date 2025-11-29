import useExamState from '@/core/components/exam/useExamState'
import { memo } from 'react'
import ExamQuestionWrapper from '@/core/components/exam/questions/ExamQuestionWrapper'
import { useTranslation } from 'react-i18next'
import trans from '@/consts/trans'
import classnames from 'classnames'
import { Icon } from '@/components'
import { ObjectStore } from '@/api/stores'
import produce from 'immer'
import { Id } from '@/utils'
import { TYPE_TO_QUESTION_NAME } from '@/core/components/exam/consts'

export default memo(({ id: examId }: { id: number }) => {
  const [state, setState] = useExamState()
  const { t } = useTranslation()
  if (state.currentViewingQuestionWithHistory) {
    const { question, historys, correct, wrong } = state.currentViewingQuestionWithHistory

    return (
      <div className={'w-full h-full pb-40 overflow-y-auto'}>
        <div className={'w-[660px] mx-auto'}>
          <div className={'flex flex-col px-5 mt-12'}>
            <div className={'transparent-font mb-2'}>
              {t(TYPE_TO_QUESTION_NAME[question.type])} • 正确 {correct} 次 • 错误 {wrong} 次
            </div>
            <div className={classnames('font-bold w-full text-3xl', !question.name && 'super-transparent-font')}>
              {question.name || t(trans.Unnamed)}
            </div>
          </div>
          <div className={'w-full flex flex-col'}>
            {historys.map((i, idx) => (
              <div className={'pt-4'}>
                <ExamQuestionWrapper
                  onViewExam={() => {
                    const exam = ObjectStore('exam').getCachedOneById(examId)
                    if (exam) {
                      const h = exam.history?.find(o => o.id === i.historyId)
                      if (h) {
                        setState(s => ({ ...s, currentViewingQuestionWithHistory: undefined, currentHistory: h, mode: 'history' }))
                      }
                    }
                  }}
                  className={classnames(idx !== historys.length - 1 && 'border-bottom', '!pt-6 !pb-10 !rounded-none')}
                  onComment={(c, id) => {
                    const exam = ObjectStore('exam').getCachedOneById(examId)
                    if (exam) {
                      const result = produce(exam, draft => {
                        const h = draft.history?.find(o => o.id === i.historyId)
                        if (h) {
                          const q = h.questions.find(o => o.id === i.question.id)
                          if (q) {
                            if (c === null && id) {
                              q.comment = q.comment?.filter(o => o.id !== id)
                              return
                            }
                            if (c === null) return
                            if (id) {
                              const comment = q.comment?.find(o => o.id === id)
                              if (comment) {
                                comment.text = c
                              }
                              return
                            }
                            if (!c) return
                            q.comment = [
                              ...(q.comment || []),
                              {
                                time: Date.now(),
                                id: Id.getId(),
                                text: c
                              }
                            ]
                          }
                        }
                      })
                      ObjectStore('exam').updateOne(result)
                      setState(s => ({
                        ...s,
                        currentViewingQuestionWithHistory: {
                          ...s.currentViewingQuestionWithHistory!,
                          historys: produce(s.currentViewingQuestionWithHistory!.historys, draft => {
                            const h = draft.find(o => o.historyId === i.historyId)
                            if (h) {
                              const res = result.history?.find(o => o.id === i.historyId)?.questions.find(o => o.id === i.question.id)
                              if (res) {
                                h.question = res
                              }
                            }
                          })
                        }
                      }))
                    }
                  }}
                  time={i.time}
                  id={i.question.id}
                  key={i.historyId}
                  question={{ ...i.question, name: i.name }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }
})
