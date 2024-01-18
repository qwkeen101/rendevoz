import { IQuestion } from '~/typings'
import { Content, Icon, Tooltip } from '@/components'
import { SelectOptionClass } from '@/core/ai/components/question/classes'
import { Colors } from '@/consts'
import { ObjectStore } from '@/api/stores'
import { IAIEvent } from '@/core/ai/components/AskAIPanel'
import { ClassName } from 'rendevoz'
import produce from 'immer'
import { css } from '@emotion/css'
import { useTranslation } from 'react-i18next'

export default ({
  question,
  showAnswer = false,
  isEditing = false,
  styles
}: {
  question: IQuestion & { questionType: 'singleSelect' }
  showAnswer?: boolean
  isEditing?: boolean
  styles?: {
    smallFontSize?: number
    contentFontSize?: number
    titleFontSize?: number
  }
}) => {
  const { t } = useTranslation()
  const suggestedAnswer = question.sAnswer
  const getBoxShadow = (i: string) => {
    if (isEditing) return
    if (showAnswer) {
      if (suggestedAnswer) {
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
    <Content flex column gap={8}>
      {question.choices?.map((i, idx) => (
        <Content
          className={SelectOptionClass}
          key={idx}
          style={{
            boxShadow: getBoxShadow(i),
            cursor: isEditing ? 'text' : 'pointer',
            minHeight: '2em',
            fontSize: styles?.contentFontSize
          }}
          onClick={() => {
            if (!isEditing) {
              ObjectStore('question').updateOne({ id: question.id, answer: question.answer === i ? undefined : i })
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
                  if (v !== i) {
                    const newChoices = produce(question.choices, draft => {
                      draft[idx] = e.target.value
                    })
                    ObjectStore('question').updateOne({ id: question.id, choices: newChoices })
                  }
                }}
                style={{
                  width: '100%',
                  fontWeight: 500
                }}
              />
              <Tooltip content={question.sAnswer === i ? t('general.Remove right answer') : t('general.Set as right answer')}>
                <Icon
                  className={ClassName.circleButton()}
                  style={{
                    color: question.sAnswer === i ? Colors.Common.Red : Colors.Common.Green
                  }}
                  onClick={() => {
                    ObjectStore('question').updateOne({ id: question.id, sAnswer: question.sAnswer === i ? undefined : i })
                  }}
                  name={question.sAnswer === i ? 'park-close' : 'park-check'}
                />
              </Tooltip>
              <Tooltip content={t('general.delete')}>
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
              </Tooltip>
            </Content>
          ) : (
            i
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
          style={{
            cursor: 'pointer'
          }}
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
          <div>{t('general.Add new option')}</div>
        </Content>
      )}
    </Content>
  )
}
