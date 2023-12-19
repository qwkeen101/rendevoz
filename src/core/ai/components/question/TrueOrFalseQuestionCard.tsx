import { IQuestion } from '~/typings'
import { memo } from 'react'
import { Content, Icon } from '@/components'
import { ClassName } from 'rendevoz'
import { Colors } from '@/consts'
import { SelectOptionClass } from '@/core/ai/components/question/classes'
import { ObjectStore } from '@/api/stores'
import { IAIEvent } from '@/core/ai/components/AskAIPanel'

export default memo(
  ({
    question,
    on,
    showAnswer = false
  }: {
    question: IQuestion & { questionType: 'trueOrFalse' }
    on?: (e: IAIEvent) => void
    showAnswer?: boolean
  }) => {
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
          正确
          {showAnswer && true === question.answer && (
            <span style={{ marginLeft: 12, color: Colors.Font.Transparent, fontSize: 13 }}>您的选择</span>
          )}
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
          错误
          {showAnswer && false === question.answer && (
            <span style={{ marginLeft: 12, color: Colors.Font.Transparent, fontSize: 13 }}>您的选择</span>
          )}
        </div>
      </Content>
    )
  }
)
