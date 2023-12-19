import { MetaStore, ObjectStore } from '@/api/stores'
import { IAIEvent } from '@/core/ai/components/AskAIPanel'
import { CSSProperties, useEffect, useRef, useState } from 'react'
import TrueOrFalseQuestionCard from '@/core/ai/components/question/TrueOrFalseQuestionCard'
import SingleSelectQuestionCard from '@/core/ai/components/question/SingleSelectQuestionCard'
import MultiSelectQuestionCard from '@/core/ai/components/question/MultiSelectQuestionCard'
import TextQuestionCard from '@/core/ai/components/question/TextQuestionCard'
import { ClassName } from 'rendevoz'
import { Content, Icon, IconWithPopover, WithBorder } from '@/components'
import { Colors } from '@/consts'
import { css } from '@emotion/css'
import { useTranslation } from 'react-i18next'
import produce from 'immer'
import QuestionActionMenu from '@/core/ai/components/question/QuestionActionMenu'
import goToQuestionPointer from '@/core/ai/components/question/goToQuestionPointer'
import { IconNameRenderer } from '@/core'
import { Rendevoz } from '@/core/rendevoz'
import { useEffectOnce } from 'react-use'
import AutosizeTextarea from '@/components/custom/input/autosizeTextarea'
export default ({
  id,
  on,
  showAnswer = false,
  pointerEllipsis = 2,
  containerStyle,
  display
}: {
  id: number
  on?: (e: IAIEvent) => any
  showAnswer?: boolean
  pointerEllipsis?: number
  containerStyle?: CSSProperties
  display?: {
    from?: boolean
    pointers?: boolean
  }
}) => {
  const question = ObjectStore('question').useValue(id)
  const [showInnerAnswer, setShowInnerAnswer] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const parentMeta = MetaStore.useObjectToMetaValue(question?.parentObjectId)
  const { t } = useTranslation()
  const executed = useRef(false)
  useEffect(() => {
    if (executed.current) return
    setTimeout(() => {
      if (question?.answerPointers?.length) {
        executed.current = true
        const newPointers = question.answerPointers.map(i => {
          if (i.pointerType === 'documentBlock') {
            const t = on?.({ type: 'getOriginalText', originalId: i.blockId })
            if (t !== undefined && t !== i.blockStr) {
              return {
                ...i,
                blockStr: t
              }
            }
          }
          return i
        })
        ObjectStore('question').updateOne({ id: question.id, answerPointers: newPointers })
      }
    }, 1000)
  }, [question?.answerPointers])
  const renderContent = () => {
    if (!question) return null
    switch (question?.questionType) {
      case 'text':
        return <TextQuestionCard question={question} />
      case 'multiSelect':
        return <MultiSelectQuestionCard question={question} isEditing={isEditing} on={on} showAnswer={showAnswer || showInnerAnswer} />
      case 'singleSelect':
        return <SingleSelectQuestionCard isEditing={isEditing} on={on} showAnswer={showAnswer || showInnerAnswer} question={question} />
      case 'trueOrFalse':
        return <TrueOrFalseQuestionCard on={on} showAnswer={showAnswer || showInnerAnswer} question={question} />
    }
  }
  if (!question) return null
  return (
    <div
      style={{
        ...(isEditing
          ? {
              padding: 12,
              borderRadius: 8,
              boxShadow: 'inset 0 0 0 1px var(--select-color)'
            }
          : undefined),
        ...containerStyle
      }}
    >
      <Content flex justifyContent={'space-between'} style={{ fontSize: 13, color: Colors.Font.Transparent, marginBottom: 4 }}>
        <div>{t(`general.${question?.questionType} question`)}</div>
        <Content flex gap={4}>
          <Icon
            className={ClassName.circleButton()}
            name={showAnswer || showInnerAnswer ? 'park-preview-open' : 'park-preview-close'}
            onClick={() => {
              setShowInnerAnswer(!showInnerAnswer)
            }}
          />
          {!isEditing && <Icon onClick={() => setIsEditing(true)} className={ClassName.circleButton()} name={'park-edit'} />}
          <Icon
            className={ClassName.circleButton()}
            name={'park-share-two'}
            onClick={() => {
              const res = on?.({
                type: 'questionGotoOriginalPlace',
                originalId: question?.answerPointers[0].blockId
              })
              if (!res) {
                goToQuestionPointer(question.id, question?.answerPointers[0].id)
              }
            }}
          />
          <IconWithPopover
            className={ClassName.circleButton()}
            name={'park-more'}
            size={14}
            placement={['right', 'left']}
            boundaryInset={10}
            renderOnParent={false}
            closeOnContentClick={true}
            content={
              <WithBorder padding={6} width={140}>
                <QuestionActionMenu id={question.id} />
              </WithBorder>
            }
          ></IconWithPopover>
        </Content>
      </Content>
      {isEditing ? (
        <AutosizeTextarea
          style={{
            fontWeight: 500,
            width: '100%',
            fontSize: 15,
            resize: 'none',
            display: 'block'
          }}
          className={ClassName.noStyleInput}
          defaultValue={question.name}
          onBlur={e => ObjectStore('question').updateOne({ id: question.id, name: e.target.value })}
        />
      ) : (
        <div className={ClassName.title('15px')}>{question?.name}</div>
      )}
      {(showAnswer || showInnerAnswer || isEditing) &&
        (isEditing ? (
          <AutosizeTextarea
            className={ClassName.noStyleInput}
            style={{
              resize: 'none',
              width: '100%',
              fontSize: 14,
              display: 'block'
            }}
            placeholder={'输入答案解析...'}
            defaultValue={question.explanation}
            onBlur={e => ObjectStore('question').updateOne({ id: question.id, explanation: e.target.value })}
          />
        ) : (
          <div style={{ fontSize: 14 }}>答案解析：{question?.explanation || '暂无解析'}</div>
        ))}
      {renderContent()}
      {question.answerPointers?.length > 0 && (
        <Content flex column gap={4} style={{ fontSize: 13, color: Colors.Font.Transparent, marginTop: 12 }}>
          <div>相关段落</div>
          {question.answerPointers?.map(
            (i, idx) =>
              i.pointerType === 'documentBlock' && (
                <div
                  onClick={() => {
                    if (isEditing && question?.answerPointerIds) {
                      const newOriginals = produce(question.answerPointerIds, draft => {
                        draft.splice(
                          draft.findIndex(o => o === i.id),
                          1
                        )
                      })
                      ObjectStore('question').updateOne({ id: question.id, answerPointerIds: newOriginals })
                    } else {
                      if (
                        !on?.({
                          type: 'questionGotoOriginalPlace',
                          originalId: i.blockId
                        })
                      ) {
                        goToQuestionPointer(question.id, i.id)
                      }
                    }
                  }}
                  key={i.id}
                  className={css([
                    pointerEllipsis > 0 && ClassName.ellipsisFont(pointerEllipsis),
                    {
                      ':hover': {
                        color: isEditing ? Colors.Common.Red : Colors.Common.SelectColor
                      },
                      letterSpacing: '-0.04px',
                      cursor: 'pointer',
                      transition: 'color 0.2s ease',
                      color: Colors.Font.Primary
                    }
                  ])}
                >
                  {question?.answerPointers.length > 1 && `${idx + 1}. `}
                  {i.blockStr}
                </div>
              )
          )}
        </Content>
      )}
      {display?.from && !isEditing && parentMeta && (
        <Content
          style={{
            fontSize: 14,
            marginTop: 12
          }}
        >
          <div
            style={{
              fontSize: 13,
              color: Colors.Font.Transparent
            }}
          >
            {t('general.from')}
          </div>
          <IconNameRenderer
            style={{ cursor: 'pointer' }}
            icon={Rendevoz.Utils.Object.getMetaObjectIcon(parentMeta.type)}
            name={parentMeta.name}
            className={css({
              ':hover': {
                color: Colors.Common.SelectColor
              },
              transition: 'color 0.2s ease'
            })}
            onClick={() => {
              Rendevoz.Actions.Open.Meta.openMetaObject(parentMeta.id)
            }}
          />
        </Content>
      )}
      {isEditing && (
        <Content flex gap={12}>
          <div
            className={ClassName.selectButton()}
            style={{
              marginTop: 12,
              fontWeight: 600,
              width: 'fit-content',
              padding: '2px 12px',
              fontSize: 14
            }}
            onClick={() => setIsEditing(false)}
          >
            完成
          </div>
          <div
            className={ClassName.selectButton()}
            style={{
              marginTop: 12,
              fontWeight: 600,
              width: 'fit-content',
              padding: '2px 12px',
              fontSize: 14,
              background: Colors.Common.Red
            }}
            onClick={() => {
              ObjectStore('question').deleteOneById(question?.id)
            }}
          >
            删除
          </div>
        </Content>
      )}
    </div>
  )
}
