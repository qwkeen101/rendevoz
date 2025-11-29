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
import trans from '@/consts/trans'

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
    <div className={'em:mt-2 em:gap-2 flex flex-col'}>
      {question.choices?.map((i, idx) => (
        <div
          className={'rounded-md border px-2 py-1'}
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
            <div className={'flex justify-between items-center w-full gap-3'}>
              <input
                className={'flex-1'}
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
              />
              <div className={'flex gap-3 icon-15'}>
                <Tooltip content={question.sAnswer === i ? t('general.Remove right answer') : t('general.Set as right answer')}>
                  <Icon
                    className={'cursor-pointer'}
                    style={{
                      color: question.sAnswer === i ? Colors.Common.Red : Colors.Common.Green
                    }}
                    onClick={() => {
                      ObjectStore('question').updateOne({ id: question.id, sAnswer: question.sAnswer === i ? undefined : i })
                    }}
                    name={question.sAnswer === i ? 'park-close' : 'park-check'}
                  />
                </Tooltip>
                <Icon
                  tooltip={t(trans.Delete)}
                  name={'park-delete-one'}
                  className={'cursor-pointer text-red-500'}
                  onClick={() => {
                    const newChoices = produce(question.choices, draft => {
                      draft.splice(idx, 1)
                    })
                    ObjectStore('question').updateOne({ id: question.id, choices: newChoices })
                  }}
                />
              </div>
            </div>
          ) : (
            i
          )}
        </div>
      ))}
      {isEditing && (
        <div
          onClick={() => {
            ObjectStore('question').updateOne({ id: question.id, choices: [...question.choices, ''] })
          }}
          style={{
            fontSize: styles?.contentFontSize
          }}
          className={SelectOptionClass}
        >
          <Icon name={'park-plus'} />
          <div>{t('general.Add new option')}</div>
        </div>
      )}
    </div>
  )
}
