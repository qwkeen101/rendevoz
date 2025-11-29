import { IExamTrueOrFalseQuestion } from '~/typings'
import { memo } from 'react'
import { ObjectStore } from '@/api/stores'
import classnames from 'classnames'
import { useExamMode } from '@/core/components/exam/useExamState'
import { useTranslation } from 'react-i18next'

export default memo(({ question: { answer, value, id }, showAnswer }: { question: IExamTrueOrFalseQuestion; showAnswer?: boolean }) => {
  const mode = useExamMode()
  const { t } = useTranslation()
  return (
    <div className={'flex flex-col em:gap-2.5 select-none'}>
      {[true, false].map(i => {
        const isSelected = ((mode === 'edit' || showAnswer) && answer === i) || ((mode === 'test' || mode === 'history') && value === i)
        const historyAnswer = mode === 'history' && answer === i
        return (
          <div
            onClick={() => {
              if (showAnswer) return
              if (mode === 'test') {
                ObjectStore('examQuestion').updateOne({ id, value: value === i ? undefined : i })
              }
              if (mode === 'edit') {
                ObjectStore('examQuestion').updateOne({ id, answer: answer === i ? undefined : i })
              }
            }}
            style={{
              '--color': !isSelected
                ? 'var(--border-solid)'
                : mode === 'history' && !(i === answer && i === value)
                  ? 'rgb(239 68 68)'
                  : (mode === 'test' || mode === 'history') && !showAnswer
                    ? 'var(--select-color)'
                    : 'rgb(34 197 94)',
              border: '1px solid var(--color)',
              fontWeight: historyAnswer ? 600 : undefined,
              background: isSelected ? 'rgba(from var(--color) r g b / 0.08)' : undefined
            }}
            className={
              'border-solid relative cursor-pointer light-hover transition-colors flex items-center em:gap-3 em:rounded-3xl em:px-3 em:py-2'
            }
            key={i === true ? 'true' : 'false'}
          >
            <div
              style={{
                width: '1.2em',
                height: '1.2em',
                border: '1px solid var(--color)'
              }}
              className={'rounded-full flex items-center justify-center'}
            >
              {isSelected && (
                <div
                  className={'rounded-full'}
                  style={{
                    width: '0.7em',
                    height: '0.7em',
                    background: 'var(--color)'
                  }}
                ></div>
              )}
            </div>
            {i === true ? t('exam.True') : t('exam.False')}
            {mode === 'history' && i === answer && (
              <span className={'font-medium super-transparent-font'}>({t('exam.Correct answer')})</span>
            )}
          </div>
        )
      })}
    </div>
  )
})
