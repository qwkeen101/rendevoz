import { IQuestion } from '~/typings'
import { memo } from 'react'
import { Content, Icon } from '@/components'
import { ClassName } from 'rendevoz'
import { Colors } from '@/consts'
import { SelectOptionClass } from '@/core/ai/components/question/classes'
import { ObjectStore } from '@/api/stores'
import { IAIEvent } from '@/core/ai/components/AskAIPanel'
import { useTranslation } from 'react-i18next'

export default memo(({ question, showAnswer = false }: { question: IQuestion & { questionType: 'trueOrFalse' }; showAnswer?: boolean }) => {
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
    <Content
      flex
      column
      gap={6}
      style={{
        marginTop: 6
      }}
    >
      <div
        className={SelectOptionClass}
        style={{
          boxShadow: getBoxShadow(true)
        }}
        onClick={() => {
          ObjectStore('question').updateOne({ id: question.id, answer: question.answer === true ? undefined : true })
        }}
      >
        {t('general.True')}
      </div>
      <div
        className={SelectOptionClass}
        style={{
          boxShadow: getBoxShadow(false)
        }}
        onClick={() => {
          ObjectStore('question').updateOne({ id: question.id, answer: question.answer === false ? undefined : false })
        }}
      >
        {t('general.False')}
      </div>
    </Content>
  )
})
