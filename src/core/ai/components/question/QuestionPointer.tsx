import { IQuestion } from '~/typings'
import { Content, Icon } from '@/components'
import { css } from '@emotion/css'
import { ClassName } from 'rendevoz'
import { Colors } from '@/consts'
import { useTranslation } from 'react-i18next'

export default ({
  pointer,
  onGotoOriginal,
  ellipsis = 0,
  idx = 0,
  isEditing,
  onDelete
}: {
  pointer: IQuestion['answerPointers'][0]
  onGotoOriginal: () => void
  ellipsis?: number
  idx: number
  isEditing?: boolean
  onDelete?: VoidFunction
}) => {
  const { t } = useTranslation()
  if (pointer.pointerType === 'pdfPage') {
    return (
      <Content flex gap={8}>
        <div
          onClick={() => {
            onGotoOriginal?.()
          }}
          className={css({
            ':hover': {
              color: Colors.Common.SelectColor
            },
            letterSpacing: '-0.04px',
            cursor: 'pointer',
            transition: 'color 0.2s ease',
            color: Colors.Font.Primary
          })}
        >
          {`${idx + 1}. `}
          {t('general.Page', { num: pointer.page + 1 }) + ': '}
          {pointer.pageStr}
        </div>
        {isEditing && (
          <Icon
            name={'park-delete'}
            className={ClassName.circleButton()}
            onClick={() => {
              onDelete?.()
            }}
          />
        )}
      </Content>
    )
  }
  if (pointer.pointerType === 'documentBlock') {
    return (
      <Content flex gap={8}>
        <div
          onClick={() => {
            onGotoOriginal?.()
            // if (
            //   !on?.({
            //     type: 'questionGotoOriginalPlace',
            //     originalId: i.blockId
            //   })
            // ) {
            //   goToQuestionPointer(question.id, i.id)
            // }
          }}
          className={css([
            ellipsis > 0 && ClassName.ellipsisFont(ellipsis),
            {
              ':hover': {
                color: Colors.Common.SelectColor
              },
              letterSpacing: '-0.04px',
              cursor: 'pointer',
              transition: 'color 0.2s ease',
              color: Colors.Font.Primary
            }
          ])}
        >
          {`${idx + 1}. `}
          {pointer.blockStr}
        </div>
        {isEditing && (
          <Icon
            name={'park-delete'}
            className={ClassName.circleButton()}
            onClick={() => {
              onDelete?.()
              // if (question?.answerPointers) {
              //   const newOriginals = produce(question.answerPointers, draft => {
              //     draft.splice(
              //       draft.findIndex(o => o.id === i.id),
              //       1
              //     )
              //   })
              //   ObjectStore('question').updateOne({ id: question.id, answerPointers: newOriginals })
              // }
            }}
          />
        )}
      </Content>
    )
  }
  return null
}
