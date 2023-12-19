import { IQuestion } from '~/typings'
import { Content, Icon } from '@/components'
import { SelectOptionClass } from '@/core/ai/components/question/classes'
import { Colors } from '@/consts'
import { ObjectStore } from '@/api/stores'
import { IAIEvent } from '@/core/ai/components/AskAIPanel'
import { ClassName } from 'rendevoz'
import produce from 'immer'
import { css } from '@emotion/css'

export default ({
  question,
  showAnswer = false,
  on,
  isEditing = false
}: {
  question: IQuestion & { questionType: 'multiSelect' }
  showAnswer?: boolean
  on?: (e: IAIEvent) => void
  isEditing?: boolean
}) => {
  const suggestedAnswer = question.sAnswer
  const getBoxShadow = (i: string) => {
    if (showAnswer) {
      if (suggestedAnswer) {
        if (suggestedAnswer.includes(i)) {
          return `inset 0 0 0 2px ${Colors.Common.Green}`
        }
        if (!suggestedAnswer.includes(i)) {
          return `inset 0 0 0 2px ${Colors.Common.Red}`
        }
        return
      }
    }
    if (isEditing) return
    if (question.answer?.includes(i)) {
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
      {question.choices.map((i, idx) => (
        <Content
          className={SelectOptionClass}
          key={idx}
          style={{
            boxShadow: getBoxShadow(i),
            cursor: isEditing ? 'text' : 'pointer',
            minHeight: '32px'
          }}
          onClick={() => {
            if (isEditing) return
            if (i) {
              const newAnswer = produce(question.answer || [], draft => {
                if (draft.includes(i)) {
                  draft.splice(
                    draft.findIndex(o => o === i),
                    1
                  )
                } else {
                  draft.push(i)
                }
              })
              ObjectStore('question').updateOne({ id: question.id, answer: newAnswer })
            }
          }}
        >
          {isEditing ? (
            <Content flex gap={6} alignItems={'center'}>
              <input
                className={ClassName.noStyleInput}
                defaultValue={i}
                onBlur={e => {
                  const v = e.target.value
                  if (question.choices.some(i => i === v)) {
                    return
                  } else {
                    const newChoices = produce(question.choices, draft => {
                      draft[idx] = e.target.value
                    })
                    ObjectStore('question').updateOne({ id: question.id, choices: newChoices })
                  }
                }}
                style={{
                  width: '100%',
                  fontWeight: 500,
                  marginRight: 6
                }}
              />
              <Icon
                className={ClassName.circleButton()}
                style={{
                  color: question.sAnswer.includes(i) ? Colors.Common.Red : Colors.Common.Green
                }}
                onClick={() => {
                  const newSAnswers = produce(question.sAnswer || [], draft => {
                    if (draft.some(o => o === i)) {
                      draft.splice(
                        draft.findIndex(o => o === i),
                        1
                      )
                    } else {
                      draft.push(i)
                    }
                  })
                  ObjectStore('question').updateOne({ id: question.id, sAnswer: newSAnswers })
                }}
                name={question.sAnswer.includes(i) ? 'park-close' : 'park-check'}
              />
              <Icon
                name={'park-delete'}
                className={ClassName.circleButton()}
                style={{
                  color: Colors.Common.Red
                }}
                onClick={() => {
                  const newChoices = produce(question.choices, draft => {
                    draft.splice(idx, 1)
                  })
                  ObjectStore('question').updateOne({ id: question.id, choices: newChoices })
                }}
              />
            </Content>
          ) : (
            i
          )}
          {showAnswer && !isEditing && question.answer?.includes(i) && (
            <span style={{ marginLeft: 12, color: Colors.Font.Transparent }}>您的选择</span>
          )}
        </Content>
      ))}
      {isEditing && (
        <Content
          onClick={() => {
            ObjectStore('question').updateOne({ id: question.id, choices: [...question.choices, ''] })
          }}
          className={SelectOptionClass}
          flex
          gap={6}
        >
          <Icon
            className={css({
              svg: {
                opacity: 1
              }
            })}
            name={'park-plus'}
          />
          <div>Add new option</div>
        </Content>
      )}
    </Content>
  )
}
