import { AutosizeTextarea } from '@/components'
import { memo } from 'react'
import { IExamTextQuestion } from '~/typings'
import { useExamMode } from '@/core/components/exam/useExamState'
import { ObjectStore } from '@/api/stores'
import classnames from 'classnames'
import { useTranslation } from 'react-i18next'

export default memo(({ question, showAnswer }: { question: IExamTextQuestion; showAnswer?: boolean }) => {
  const mode = useExamMode()
  const { t } = useTranslation()
  return (
    <>
      {mode !== 'history' && (
        <AutosizeTextarea
          disabled={showAnswer}
          onChange={e => {
            if (mode === 'edit') {
              ObjectStore('examQuestion').updateOne({ id: question.id, answer: e })
            }
            if (mode === 'test') {
              ObjectStore('examQuestion').updateOne({ id: question.id, value: e })
            }
          }}
          value={mode === 'edit' || showAnswer ? question.answer ?? '' : question.value ?? ''}
          className={'border em:py-2 em:px-3 em:rounded-lg cursor-text'}
          placeholder={t('exam.Type your answer')}
        />
      )}
      {mode === 'history' && (
        <div>
          <div className={'font-medium mb-2'}>{t('exam.Your answer')}</div>
          <div className={classnames('exam-history-item', question.value !== question.answer && 'text-red-500')}>{question.value}</div>
          <div className={'font-medium mb-2 mt-5'}>{t('exam.Correct answer')}</div>
          <div className={'exam-history-item'}>{question.answer}</div>
        </div>
      )}
    </>
  )
})
