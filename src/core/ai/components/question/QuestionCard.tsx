import { MetaStore, ObjectStore } from '@/api/stores'
import { IAIEvent } from '@/core/ai/components/AskAIPanel'
import { CSSProperties, useEffect, useRef, useState } from 'react'
import TrueOrFalseQuestionCard from '@/core/ai/components/question/TrueOrFalseQuestionCard'
import SingleSelectQuestionCard from '@/core/ai/components/question/SingleSelectQuestionCard'
import MultiSelectQuestionCard from '@/core/ai/components/question/MultiSelectQuestionCard'
import TextQuestionCard from '@/core/ai/components/question/TextQuestionCard'
import { Content, Icon, IconWithPopover, MentionInput, WithBorder, AutosizeTextarea } from '@/components'
import { Colors, Icons } from '@/consts'
import { css } from '@emotion/css'
import { useTranslation } from 'react-i18next'
import QuestionActionMenu from '@/core/ai/components/question/QuestionActionMenu'
import { IconNameRenderer } from '@/core'
import Select from '@/components/base/select'
import QuestionStore from '@/api/stores/question.store'
import SimpleEditor from '@/core/components/editor/SimpleEditor'
import ClozeQuestion from '@/core/ai/components/question/ClozeQuestion'
import trans from '@/consts/trans'
import classnames from 'classnames'

export default ({
  id,
  on,
  showAnswer = false,
  containerStyle,
  display,
  autoFocus = true,
  styles = {
    contentFontSize: '1rem',
    smallFontSize: '0.86rem',
    titleFontSize: '1.2rem'
  }
}: {
  id: number
  on?: (e: IAIEvent) => any
  showAnswer?: boolean
  containerStyle?: CSSProperties
  autoFocus?: boolean
  styles?: {
    smallFontSize?: number | string
    contentFontSize?: number | string
    titleFontSize?: number | string
  }
  display?: {
    from?: boolean
    pointers?: boolean
    title?: boolean
    headBar?: boolean
    more?: boolean
    delete?: boolean
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
    <div className={'p-3'} style={containerStyle}>
      {display?.headBar !== false && (
        <div className={'flex justify-between items-center transparent-font'} style={{ fontSize: styles.smallFontSize }}>
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
          <div
            className={'flex gap-2'}
            style={{
              fontSize: '1.15em'
            }}
          >
            <Icon
              className={'square-button-small'}
              name={showAnswer || showInnerAnswer ? 'park-preview-open' : 'park-preview-close'}
              onClick={() => {
                setShowInnerAnswer(!showInnerAnswer)
              }}
            />
            <Icon
              onClick={() => setIsEditing(!isEditing)}
              className={classnames('square-button-small', isEditing && 'active-button')}
              name={'park-edit'}
            />
            {display?.more !== false && (
              <IconWithPopover
                className={'square-button-small'}
                name={Icons.More}
                align={'start'}
                size={null}
                placement={['right', 'left']}
                renderOnParent={false}
                closeOnContentClick={true}
                content={
                  <WithBorder className={'p-1 min-w-48'}>
                    <QuestionActionMenu id={question.id} />
                  </WithBorder>
                }
              ></IconWithPopover>
            )}
          </div>
        </div>
      )}
      {display?.title !== false && (
        <AutosizeTextarea
          style={{
            fontWeight: 500,
            width: '100%',
            fontSize: styles.contentFontSize,
            resize: 'none',
            userSelect: 'auto',
            display: 'block',
            cursor: 'text'
          }}
          autoFocus={autoFocus}
          value={question.name}
          placeholder={t(trans.Unnamed)}
          debounceChange
          onChange={e => {
            if (questionMeta) {
              MetaStore.updateMetaObject({ id: questionMeta.id, name: e ?? '' })
            } else {
              ObjectStore('question').updateOne({ id: question.id, name: e ?? '' })
            }
          }}
        />
      )}
      {renderContent()}
      {(showAnswer || showInnerAnswer || isEditing) && (
        <>
          <div className={'transparent-font font-size-12'} style={{ fontSize: styles.smallFontSize, marginTop: 12 }}>
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
            icon={Global.utils.getIcon(parentMeta.type)}
            name={parentMeta.name}
            className={css({
              ':hover': {
                color: Colors.Common.SelectColor
              },
              transition: 'color 0.2s ease'
            })}
            onClick={() => {
              Global.layoutOps?.openObject(parentMeta.id)
            }}
          />
        </Content>
      )}
    </div>
  )
}
