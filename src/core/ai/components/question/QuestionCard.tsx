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
import AutosizeTextarea from '@/components/custom/input/autosizeTextarea'
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
  const questionMeta = MetaStore.useObjectToMetaValue(id)
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
        return <TextQuestionCard question={question} metaId={questionMeta?.id} />
      case 'multiSelect':
        return <MultiSelectQuestionCard question={question} isEditing={isEditing} on={on} showAnswer={showAnswer || showInnerAnswer} />
      case 'singleSelect':
        return <SingleSelectQuestionCard isEditing={isEditing} on={on} showAnswer={showAnswer || showInnerAnswer} question={question} />
      case 'trueOrFalse':
        return <TrueOrFalseQuestionCard on={on} showAnswer={showAnswer || showInnerAnswer} question={question} />
      case 'cloze':
        return <ClozeQuestion question={question} metaId={questionMeta?.id} />
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
      <Content flex justifyContent={'space-between'} style={{ fontSize: 13, color: Colors.Font.Transparent, marginBottom: 6 }}>
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
      <DraggableElement
        draggingDetails={{
          type: 'question',
          objectId: id
        }}
        draggable={!isEditing}
      >
        <AutosizeTextarea
          style={{
            fontWeight: 500,
            width: '100%',
            fontSize: 15,
            resize: 'none',
            userSelect: isEditing ? 'auto' : 'none',
            display: 'block',
            marginBottom: 12,
            cursor: isEditing ? 'text' : 'grab'
          }}
          disabled={!isEditing}
          className={ClassName.noStyleInput}
          defaultValue={question.name}
          placeholder={'Untitled'}
          onBlur={e => {
            if (questionMeta) {
              MetaStore.updateMetaObject({ id: questionMeta.id, name: e.target.value })
            } else {
              ObjectStore('question').updateOne({ id: question.id, name: e.target.value })
            }
          }}
        />
      </DraggableElement>
      {renderContent()}
      {(showAnswer || showInnerAnswer || isEditing) && (
        <>
          <div style={{ fontSize: 13, color: Colors.Font.Transparent, marginTop: 12, marginBottom: 4 }}>{t('general.Explanation')}</div>
          <SimpleEditor
            metaId={questionMeta?.id}
            fontSize={14}
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
        <Content flex column gap={4} style={{ fontSize: 13, color: Colors.Font.Transparent, marginTop: 12 }}>
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
