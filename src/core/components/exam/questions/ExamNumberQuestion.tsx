import { IExamNumberQuestion } from '~/typings'
import { ObjectStore } from '@/api/stores'
import { memo } from 'react'
import { useExamMode } from '@/core/components/exam/useExamState'
import classnames from 'classnames'
import { useTranslation } from 'react-i18next'

export default memo(({ question, showAnswer }: { question: IExamNumberQuestion; showAnswer?: boolean }) => {
  const mode = useExamMode()
  const { t } = useTranslation()
  return (
    <>
      {mode !== 'history' && (
        <input
          type={'text'}
          defaultValue={mode === 'edit' || showAnswer ? question.answer ?? '' : question.value ?? ''}
          placeholder={t('exam.Type number')}
          className={'exam-number-input'}
          disabled={showAnswer}
          onChange={e => {
            let value = e.target.value
            // 允许小数和负数
            value = value.replace(/[^0-9.-]/g, '')
            // 确保小数点只有一个
            value = value.replace(/(\..*)\./g, '$1')
            // 确保负号在开头
            value = value.replace(/(?!^)-/g, '')
            e.target.value = value
            if (mode === 'edit') {
              ObjectStore('examQuestion').updateOne({ id: question.id, answer: value })
            } else {
              ObjectStore('examQuestion').updateOne({ id: question.id, value: value })
            }
          }}
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
