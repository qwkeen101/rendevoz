import { IQuestion } from '~/typings'
import { Content, Icon, Tooltip } from '@/components'
import { SelectOptionClass } from '@/core/ai/components/question/classes'
import { Colors } from '@/consts'
import { ObjectStore } from '@/api/stores'
import produce from 'immer'
import { useTranslation } from 'react-i18next'

export default ({
  question,
  showAnswer = false,
  isEditing = false,
  styles
}: {
  question: IQuestion & { questionType: 'multiSelect' }
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
    <div className={'em:mt-2 em:gap-2 flex flex-col'}>
      {question.choices?.map((i, idx) => (
        <div
          className={'rounded-md border px-2 py-1'}
          key={idx}
          style={{
            fontSize: styles?.contentFontSize,
            boxShadow: getBoxShadow(i),
            cursor: isEditing ? 'text' : 'pointer',
            minHeight: '2em'
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
            <div className={'flex gap-3 justify-between items-center w-full'}>
              <input
                className={'flex-1'}
                defaultValue={i}
                onBlur={e => {
                  if (e.target.value !== i) {
                    const newChoices = produce(question.choices, draft => {
                      draft[idx] = e.target.value
                    })
                    ObjectStore('question').updateOne({ id: question.id, choices: newChoices })
                  }
                }}
              />
              <div className={'flex gap-3 icon-15'}>
                <Tooltip content={question.sAnswer?.includes(i) ? t('general.Remove right answer') : t('general.Set as right answer')}>
                  <Icon
                    className={'cursor-pointer'}
                    style={{
                      color: question.sAnswer?.includes(i) ? Colors.Common.Red : Colors.Common.Green
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
                    name={question.sAnswer?.includes(i) ? 'park-close' : 'park-check'}
                  />
                </Tooltip>
                <Tooltip content={t('general.delete')}>
                  <Icon
                    name={'park-delete-one'}
                    className={'cursor-pointer text-red-500'}
                    onClick={() => {
                      const newChoices = produce(question.choices, draft => {
                        draft.splice(idx, 1)
                      })
                      ObjectStore('question').updateOne({ id: question.id, choices: newChoices })
                    }}
                  />
                </Tooltip>
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
            cursor: 'pointer',
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
