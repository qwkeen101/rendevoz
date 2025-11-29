import { IQuestion } from '~/typings'
import { memo } from 'react'
import { Content, Icon } from '@/components'
import { ClassName } from 'rendevoz'
import { Colors } from '@/consts'
import { SelectOptionClass } from '@/core/ai/components/question/classes'
import { ObjectStore } from '@/api/stores'
import { IAIEvent } from '@/core/ai/components/AskAIPanel'
import { useTranslation } from 'react-i18next'

export default memo(
  ({
    question,
    showAnswer = false,
    styles
  }: {
    question: IQuestion & { questionType: 'trueOrFalse' }
    showAnswer?: boolean
    styles?: {
      smallFontSize?: number
      contentFontSize?: number
      titleFontSize?: number
    }
  }) => {
    const { t } = useTranslation()
    const suggestedAnswer = question.sAnswer
    const getBoxShadow = (i: boolean) => {
      if (showAnswer) {
        if (suggestedAnswer !== undefined) {
          if (suggestedAnswer === i) {
            return `inset 0 0 0 2px ${Colors.Common.Green}`
          }
          if (suggestedAnswer !== i) {
            return `inset 0 0 0 2px ${Colors.Common.Red}`
          }
          return
        }
      }
      if (i === question.answer) {
        return `inset 0 0 0 2px ${Colors.Common.SelectColor}`
      }
    }
    return (
      <div
        className={'flex em:gap-2 flex-col em:mt-2'}
        style={{
          fontSize: styles?.contentFontSize
        }}
      >
        <div
          className={'rounded-md border px-2 py-1 cursor-pointer'}
          style={{
            boxShadow: getBoxShadow(true),
            minHeight: '2em'
          }}
          onClick={() => {
            ObjectStore('question').updateOne({ id: question.id, answer: question.answer === true ? undefined : true })
          }}
        >
          {t('general.True')}
        </div>
        <div
          className={'rounded-md border px-2 py-1 cursor-pointer'}
          style={{
            minHeight: '2em',
            boxShadow: getBoxShadow(false)
          }}
          onClick={() => {
            ObjectStore('question').updateOne({ id: question.id, answer: question.answer === false ? undefined : false })
          }}
        >
          {t('general.False')}
        </div>
      </div>
    )
  }
)
