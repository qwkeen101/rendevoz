import { AnimatePopover, Content, Icon, IconWithPopover, Tooltip, WithBorder, ContentEditor } from '@/components'
import { MetaStore, ObjectStore } from '@/api/stores'
import { CSSProperties, useState } from 'react'
import { DraggableElement } from '../global'
import ClassName from '@/styles/classNames'
import FontSize from '@/consts/font'
import LabelActionMenu, { LabelActionEvent } from './LabelActionMenu'
import { AttachmentWrapper, useRenderObject } from '.'
import BorderInput from '@/components/base/BorderInput'
import { useTranslation } from 'react-i18next'
import { Colors } from '@/consts'
import { useGlobalAtomValue, useIsIn, useSelectGlobalAtomValue } from '@/hooks'
import { relatedMetaObjectsMapAtom } from '@/api/stores/meta.store'
import { SettingAtom } from '@/core'
import { getColor } from '@/consts/targetColor'
import { Rendevoz } from '@/core/rendevoz'
const DEFAULT_LABEL_NAME = 'Unnamed Label'
const useRenderLabel = (opts: {
  objectId: number
  type: 'videoLabel' | 'pdfLabel' | 'noteLabel' | 'webpageLabel'
  draggable?: boolean
  onDragStart?: VoidFunction
  onNavigate?: VoidFunction
}) => {
  const { objectId, type, draggable } = opts
  const label = ObjectStore(opts.type).useValue(opts.objectId)
  if (label && !label.parentObjectId && (label.webpageId || label.videoId || label.pdfId || label.noteId)) {
    ObjectStore(type).updateOne({ id: objectId, parentObjectId: label.webpageId || label.videoId || label.pdfId || label.noteId })
  }
  const parentMeta = MetaStore.useObjectToMetaValue(label?.parentObjectId)
  const labelMeta = MetaStore.useObjectToMetaValue(opts.objectId)
  const { t } = useTranslation()
  const [labelState, setLabelState] = useState<{
    addingAttachment: boolean
    addingDescription: boolean
    focused: boolean
    editingName: boolean
    showMoreText: boolean
    editingOrigin: boolean
  }>({
    focused: false,
    editingOrigin: false,
    editingName: false,
    addingDescription: false,
    addingAttachment: false,
    showMoreText: false
  })
  const { ref, isIn } = useIsIn()
  const currentLabelHasName = label && label.name && label.name !== DEFAULT_LABEL_NAME
  const relatedMap = useGlobalAtomValue(relatedMetaObjectsMapAtom)
  const metaRelated = labelMeta && relatedMap.get(labelMeta.id)
  const realRelated = new Set(metaRelated)
  if (parentMeta) {
    realRelated.delete(parentMeta.id)
  }
  const customBackground = useSelectGlobalAtomValue(SettingAtom, s => s.label.customTextBackground)
  const renderName = ({ onNameClick }: { onNameClick?: (name?: string) => void }) => {
    return (
      <Content flex column auto>
        {labelState.editingName ? (
          <ContentEditor
            placeholder={t('general.Add note for label')}
            value={currentLabelHasName ? label?.name : undefined}
            onChange={v => {
              ObjectStore(type).updateOne({ id: objectId, name: v || DEFAULT_LABEL_NAME })
              setLabelState(s => ({ ...s, editingName: false }))
            }}
          />
        ) : (
          <DraggableElement draggable={draggable} onDragStart={opts.onDragStart}>
            <div
              style={{
                cursor: 'pointer',
                width: 'fit-content',
                whiteSpace: 'pre-wrap',
                fontSize: FontSize['13px'],
                color: labelMeta ? labelMeta.color || Colors.Common.SelectColor : undefined
              }}
            >
              {realRelated.size > 0 && (
                <AnimatePopover
                  content={
                    <WithBorder style={{ fontSize: '0.85rem', maxWidth: 400 }} padding={6}>
                      <div className={ClassName.description()}>{t('general.related objects')}</div>
                      {Array.from(realRelated.values()).map(i => (
                        <LabelRelatedItem metaId={i} key={i} />
                      ))}
                    </WithBorder>
                  }
                >
                  <Tooltip content="Click to show related objects">
                    <span
                      onClick={e => {
                        e.stopPropagation()
                      }}
                      style={{ padding: '2px 4px', borderRadius: 4, marginRight: 4, background: Colors.Background.Border }}
                    >
                      {realRelated.size}
                    </span>
                  </Tooltip>
                </AnimatePopover>
              )}
              <span
                style={{
                  color: labelMeta
                    ? labelMeta.color || Colors.Common.SelectColor
                    : currentLabelHasName
                    ? undefined
                    : Colors.Font.Transparent,
                  fontWeight: 500,
                  wordBreak: 'break-word'
                }}
                onClick={() => {
                  setLabelState(s => ({ ...s, editingName: true }))
                }}
              >
                {currentLabelHasName ? label?.name : t('general.Click to add note')}
              </span>
            </div>
          </DraggableElement>
        )}
      </Content>
    )
  }
  const renderPopover = ({ on }: { on?: (e: LabelActionEvent) => void }) => {
    if (labelState.editingName) return null
    return (
      <Content
        flex
        gap={4}
        style={{
          opacity: isIn ? 1 : 0,
          transition: 'all 0.2s ease',
          position: 'absolute',
          right: 0,
          top: 0,
          padding: '3px 5px',
          background: Colors.Background.Secondary,
          borderRadius: 999,
          border: `1px solid ${Colors.Background.Border}`
        }}
      >
        <Icon
          size={14}
          name={'park-share-two'}
          onClick={() => {
            opts.onNavigate?.()
          }}
          className={ClassName.circleButton(3)}
        />
        <IconWithPopover
          name="park-more"
          size={14}
          className={ClassName.circleButton(3)}
          closeOnContentClick="[role='button']"
          placement={['left', 'right']}
          renderOnParent={false}
          disableNudge={true}
          content={
            <LabelActionMenu
              on={async event => {
                on?.(event)
                switch (event.type) {
                  case 'addAttachment':
                    setLabelState(s => ({ ...s, addingAttachment: true }))
                    break
                  case 'editOriginal': {
                    setLabelState(s => ({ ...s, editingOrigin: true }))
                    break
                  }
                  case 'addDescription':
                    setLabelState(s => ({
                      ...s,
                      addingDescription: !s.addingDescription
                    }))
                    break
                  case 'delete':
                    break
                  case 'changeName':
                    setLabelState(s => ({ ...s, editingName: true }))
                    break
                }
              }}
              objectId={objectId}
              type={type}
            />
          }
        ></IconWithPopover>
      </Content>
    )
  }
  const renderAttachment = ({
    style,
    renderAttOnParent,
    renderObjectDetailsOnParent
  }: {
    style?: CSSProperties
    renderObjectDetailsOnParent?: boolean
    renderAttOnParent?: boolean
  }) => {
    return labelMeta?.attachments?.length || (labelState.addingAttachment && labelMeta) ? (
      <AttachmentWrapper
        style={{ marginTop: 4, ...style }}
        metaId={labelMeta.id}
        visible
        closeIcon={labelState.addingAttachment && !labelMeta.attachments?.length}
        onClose={() => setLabelState(s => ({ ...s, addingAttachment: false }))}
        onAttachmentsChange={atts => MetaStore.updateMetaObject({ id: labelMeta.id, attachments: atts }, true)}
        attachments={labelMeta?.attachments}
        renderObjectDetailsOnParent={renderObjectDetailsOnParent}
        renderAttOnParent={renderAttOnParent}
      />
    ) : null
  }
  const renderDescription = ({ style }: { style?: CSSProperties }) => {
    return (
      <>
        {label?.description && !labelState.addingDescription && (
          <div
            style={{
              whiteSpace: 'pre-wrap',
              textTransform: 'none',
              wordBreak: 'break-all',
              ...style
            }}
            onContextMenu={() => setLabelState(s => ({ ...s, addingDescription: true }))}
            className={ClassName.description(FontSize['12px'])}
          >
            {label.description}
          </div>
        )}
        {labelState.addingDescription && (
          <BorderInput
            textarea
            onKeyDown={e => {
              e.stopPropagation()
            }}
            minRows={3}
            maxRows={8}
            placeholder={t('general.edit description')}
            defaultValue={label?.description}
            containerStyle={style}
            style={{
              fontSize: FontSize['12px'],
              padding: '8px 12px'
            }}
            withSubmit
            onSubmit={(v: string) => {
              setLabelState(s => ({ ...s, addingDescription: false }))
              ObjectStore(type).updateOne({ id: objectId, description: v })
            }}
          />
        )}
      </>
    )
  }

  const renderOriginalText = (opts: {
    text: string
    style?: CSSProperties
    showEdit?: boolean
    ellipis?: boolean
    editorStyle?: CSSProperties
    onClick?: VoidFunction
    clickToEdit?: boolean
  }) => {
    if (labelState.editingOrigin) {
      return (
        <ContentEditor
          style={opts.editorStyle}
          value={opts.text}
          onChange={v => {
            setLabelState(s => ({ ...s, editingOrigin: false }))
            ObjectStore(type).updateOne({ id: label?.id, selectedText: v })
          }}
        />
      )
    }
    return (
      <div
        style={{
          fontSize: 13,
          padding: '4px 8px',
          borderRadius: 4,
          cursor: 'pointer',
          background: customBackground
            ? label?.color
              ? getColor(label.color)
              : Colors.Background.ButtonHover
            : Colors.Background.ButtonHover,
          ...opts.style
        }}
        onContextMenu={() => {
          setLabelState(s => ({ ...s, editingOrigin: true }))
        }}
        onClick={e => {
          if (!window.getSelection()?.toString()) {
            if (opts.clickToEdit) {
              setLabelState(s => ({ ...s, editingOrigin: true }))
              return
            }
            if (opts.onClick) {
              opts.onClick()
              return
            }
          }
        }}
      >
        <div
          style={{
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}
        >
          {opts.text}
        </div>
      </div>
    )
  }
  return {
    renderName,
    renderPopover,
    renderAttachment,
    renderDescription,
    renderOriginalText,
    labelMeta,
    label,
    setDraggingDetails: Rendevoz.Actions.State.Drag.setDraggingDetails,
    ref
  }
}

const LabelRelatedItem = ({ metaId }: { metaId: number }) => {
  const { renderInline } = useRenderObject({ metaObjectId: metaId })
  return renderInline({
    showCircle: false,
    showHoverObjectDetails: true,
    ellipsisLine: 2,
    renderObjectDetailsOnParent: true,
    renderAttOnParent: true,
    containerStyle: { width: 'fit-content' }
  })
}
export default useRenderLabel
