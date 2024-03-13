import { MetaStore, ObjectStore } from '@/api/stores'
import { IAIEvent } from '@/core/ai/components/AskAIPanel'
import { CSSProperties, useEffect, useRef, useState } from 'react'
import TrueOrFalseQuestionCard from '@/core/ai/components/question/TrueOrFalseQuestionCard'
import SingleSelectQuestionCard from '@/core/ai/components/question/SingleSelectQuestionCard'
import MultiSelectQuestionCard from '@/core/ai/components/question/MultiSelectQuestionCard'
import TextQuestionCard from '@/core/ai/components/question/TextQuestionCard'
import { ClassName } from 'rendevoz'
import { Content, Icon, IconWithPopover, MentionInput, WithBorder } from '@/components'
import { Colors } from '@/consts'
import { css } from '@emotion/css'
import { useTranslation } from 'react-i18next'
import produce from 'immer'
import QuestionActionMenu from '@/core/ai/components/question/QuestionActionMenu'
import goToQuestionPointer from '@/core/ai/components/question/goToQuestionPointer'
import { DraggableElement, IconNameRenderer } from '@/core'
import { Rendevoz } from '@/core/rendevoz'
import AutosizeTextarea from '@/components/custom/input/AutoSizeTextArea'
import Select from '@/components/base/select'
import QuestionStore from '@/api/stores/question.store'
import SimpleEditor from '@/core/components/editor/SimpleEditor'
import ClozeQuestion from '@/core/ai/components/question/ClozeQuestion'
import QuestionPointer from '@/core/ai/components/question/QuestionPointer'
export default ({
  id,
  on,
  showAnswer = false,
  pointerEllipsis = 2,
  containerStyle,
  display,
  styles = {
    contentFontSize: 14,
    smallFontSize: 13,
    titleFontSize: 15
  }
}: {
  id: number
  on?: (e: IAIEvent) => any
  showAnswer?: boolean
  pointerEllipsis?: number
  containerStyle?: CSSProperties
  styles?: {
    smallFontSize?: number
    contentFontSize?: number
    titleFontSize?: number
  }
  display?: {
    from?: boolean
    pointers?: boolean
    title?: boolean
    headBar?: boolean
  }
}) => {
  const question = ObjectStore('question').useValue(id)
  const questionMeta = MetaStore.useObjectToMetaValue(id)
  const [showInnerAnswer, setShowInnerAnswer] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const parentMeta = MetaStore.useObjectToMetaValue(question?.parentObjectId)
  const { t } = useTranslation()
  const executed = useRef(false)
  const titleRef = useRef<HTMLDivElement>(null)
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
  useEffect(() => {
    if (isEditing) {
      console.log(titleRef.current)
      setTimeout(() => {
        titleRef.current?.focus()
      })
    }
  }, [isEditing])
  const renderContent = () => {
    if (!question) return null
    switch (question?.questionType) {
      case 'text':
        return <TextQuestionCard question={question} metaId={questionMeta?.id} styles={styles} />
      case 'multiSelect':
        return (
          <MultiSelectQuestionCard
            styles={styles}
            question={question}
            isEditing={isEditing}
            on={on}
            showAnswer={showAnswer || showInnerAnswer}
          />
        )
      case 'singleSelect':
        return (
          <SingleSelectQuestionCard
            styles={styles}
            isEditing={isEditing}
            on={on}
            showAnswer={showAnswer || showInnerAnswer}
            question={question}
          />
        )
      case 'trueOrFalse':
        return <TrueOrFalseQuestionCard styles={styles} on={on} showAnswer={showAnswer || showInnerAnswer} question={question} />
      case 'cloze':
        return <ClozeQuestion styles={styles} question={question} metaId={questionMeta?.id} />
    }
  }
  if (!question) return null
  return (
    <div
      style={{
        padding: '6px 12px 24px',
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
      {display?.headBar !== false && (
        <Content
          flex
          justifyContent={'space-between'}
          style={{ fontSize: styles.smallFontSize, color: Colors.Font.Transparent, marginBottom: 6, height: 24 }}
        >
          <Select
            closeOnSelect
            style={{
              marginLeft: '-4px',
              padding: '2px 4px',
              height: 'auto'
            }}
            options={['text', 'cloze', 'singleSelect', 'multiSelect', 'trueOrFalse'].map(i => ({
              value: i,
              children: t(`general.${i} question`)
            }))}
            onSelect={v => {
              QuestionStore.resetQuestionType(id, v[0])
            }}
            value={question?.questionType}
          ></Select>
          <Content flex gap={4} style={{ fontSize: 15 }}>
            <Icon
              className={ClassName.circleButton()}
              name={showAnswer || showInnerAnswer ? 'park-preview-open' : 'park-preview-close'}
              onClick={() => {
                setShowInnerAnswer(!showInnerAnswer)
              }}
            />
            <Icon onClick={() => setIsEditing(!isEditing)} className={ClassName.circleButton()} name={'park-edit'} />
            <IconWithPopover
              className={ClassName.circleButton()}
              name={'park-more'}
              size={15}
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
      )}
      {display?.title !== false && (
        <DraggableElement
          draggingDetails={{
            type: 'question',
            objectId: id
          }}
          draggable={false}
          ref={titleRef}
        >
          <AutosizeTextarea
            style={{
              fontWeight: 500,
              width: '100%',
              fontSize: styles.contentFontSize,
              resize: 'none',
              userSelect: 'auto',
              display: 'block',
              marginBottom: 12,
              cursor: 'text'
            }}
            disabled={!isEditing}
            className={ClassName.noStyleInput}
            defaultValue={question.name}
            placeholder={'Untitled'}
            onBlur={e => {
              if (questionMeta) {
                MetaStore.updateMetaObject({ id: questionMeta.id, name: e.target.innerText ?? '' })
              } else {
                ObjectStore('question').updateOne({ id: question.id, name: e.target.innerText ?? '' })
              }
            }}
          />
        </DraggableElement>
      )}
      {renderContent()}
      {(showAnswer || showInnerAnswer || isEditing) && (
        <>
          <div style={{ fontSize: styles.smallFontSize, color: Colors.Font.Transparent, marginTop: 12, marginBottom: 4 }}>
            {t('general.Explanation')}
          </div>
          <SimpleEditor
            metaId={questionMeta?.id}
            fontSize={styles.contentFontSize}
            changeOnBlur={true}
            textareaMode={true}
            value={question.explanation}
            onChange={v => {
              ObjectStore('question').updateOne({ id: question.id, explanation: v })
            }}
          />
        </>
      )}
      {question.answerPointers?.length > 0 && (
        <Content flex column gap={4} style={{ fontSize: styles.smallFontSize, color: Colors.Font.Transparent, marginTop: 12 }}>
          <div>{t('general.Relevant paragraphs')}</div>
          {question.answerPointers?.map((i, idx) => (
            <QuestionPointer
              isEditing={isEditing}
              ellipsis={pointerEllipsis}
              idx={idx}
              onGotoOriginal={() => {
                if (
                  !on?.({
                    type: 'questionGotoOriginalPlace',
                    originalId: i.blockId || i.page
                  })
                ) {
                  goToQuestionPointer(question.id, i.id)
                }
              }}
              onDelete={() => {
                if (question?.answerPointers) {
                  const newOriginals = produce(question.answerPointers, draft => {
                    draft.splice(
                      draft.findIndex(o => o.id === i.id),
                      1
                    )
                  })
                  ObjectStore('question').updateOne({ id: question.id, answerPointers: newOriginals })
                }
              }}
              key={i.id}
              pointer={i}
            />
          ))}
        </Content>
      )}
      {display?.from && !isEditing && parentMeta && (
        <Content
          style={{
            fontSize: styles.contentFontSize,
            marginTop: 12
          }}
        >
          <div
            style={{
              fontSize: styles.smallFontSize,
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
