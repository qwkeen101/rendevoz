import { ObjectStore } from '@/api/stores'
import ExamQuestionWrapper from '@/core/components/exam/questions/ExamQuestionWrapper'
import { useMemo } from 'react'
import { createStore, Provider } from 'jotai'
import { ExamStateAtom } from '@/core/components/exam/useExamState'
import { useTranslation } from 'react-i18next'
import classnames from 'classnames'
import { TYPE_TO_QUESTION_NAME } from '@/core/components/exam/consts'

const ExamQuestionDisplayer = ({ id }: { id?: number }) => {
  const question = ObjectStore('examQuestion').useValue(id)
  const store = useMemo(() => {
    const s = createStore()
    s.set(ExamStateAtom, { ...s.get(ExamStateAtom), mode: 'display' })
    return s
  }, [])
  const { t } = useTranslation()
  if (!id || !question) return null
  return (
    <div className={'font-size-11 p-3'}>
      <div className={'font-size-12'}>
        <span>{t(TYPE_TO_QUESTION_NAME[question.type])}</span>
        <span className={'em:mx-1'}>•</span>
        <span className={classnames(!question?.name && 'super-transparent-font')}>{question?.name || t('exam.Question name')}</span>
      </div>
      <Provider store={store}>
        <ExamQuestionWrapper id={id} />
      </Provider>
    </div>
  )
}

export default ExamQuestionDisplayer
