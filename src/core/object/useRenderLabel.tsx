import { AnimatePopover, Content, Icon, IconWithPopover, Tooltip, WithBorder, ContentEditor } from '@/components'
import { MetaStore, ObjectStore } from '@/api/stores'
import { CSSProperties, useEffect, useState } from 'react'
import { DraggableElement } from '../global'
import ClassName from '@/styles/classNames'
import FontSize from '@/consts/font'
import LabelActionMenu, { LabelActionEvent } from './LabelActionMenu'
import { AttachmentWrapper, useRenderObject } from '.'
import { useTranslation } from 'react-i18next'
import { Colors } from '@/consts'
import { GlobalInstance, useGlobalAtomValue, useIsIn } from '@/hooks'
import { relatedMetaObjectsMapAtom } from '@/api/stores/meta/meta.store'
import { Rendevoz } from '@/core/rendevoz'
import { ILabel } from '~/typings'
const DEFAULT_LABEL_NAME = 'Unnamed Label'
const useRenderLabel = (opts: {
  objectId: number
  type: 'videoLabel' | 'pdfLabel' | 'noteLabel' | 'webpageLabel'
  draggable?: boolean
  onDragStart?: VoidFunction
  onNavigate?: VoidFunction
}) => {
  const { objectId, type, draggable } = opts
  const label = ObjectStore(opts.type).useValue(opts.objectId) as ILabel | undefined
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
  const metaRelated = labelMeta ? relatedMap.get(labelMeta.id) : []
  const realRelated = new Set(metaRelated)
  if (parentMeta) {
    realRelated.delete(parentMeta.id)
  }
  const customBackground = true
  // const customBackground = useSelectGlobalAtomValue(SettingAtom, s => s.label.customTextBackground)
  const renderName = ({ onNameClick }: { onNameClick?: (name?: string) => void }) => {
    return (
      <Content flex column auto>
        {labelState.editingName ? (
          <ContentEditor
            placeholder={t('general.Add note for label')}
            value={currentLabelHasName ? label?.name : undefined}
            onChange={v => {
              setLabelState(s => ({ ...s, editingName: false }))
              if (labelMeta) {
                MetaStore.updateMetaObject({ id: labelMeta.id, name: v })
                return
              }
              ObjectStore(type).updateOne({ id: objectId, name: v })
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
                color: labelMeta && !labelMeta.temp ? labelMeta.color || Colors.Common.SelectColor : undefined
              }}
            >
              {realRelated.size > 0 && (
                <AnimatePopover
                  containerStyle={{
                    zIndex: '500'
                  }}
                  content={
                    <WithBorder style={{ maxWidth: 400 }} width={180} padding={6}>
                      <div className={'font-size-12 transparent-font'}>{t('general.related objects')}</div>
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
                      style={{
                        padding: '2px 4px',
                        borderRadius: 4,
                        marginRight: 4,
                        background: Colors.Common.SelectColorTransparent,
                        color: Colors.Common.SelectColor
                      }}
                    >
                      {realRelated.size}
                    </span>
                  </Tooltip>
                </AnimatePopover>
              )}
              <span
                onClick={() => {
                  setLabelState(s => ({ ...s, editingName: true }))
                }}
                style={{
                  color:
                    labelMeta && !labelMeta.temp && !labelMeta.hidden
                      ? labelMeta.color || Colors.Common.SelectColor
                      : currentLabelHasName
                      ? undefined
                      : Colors.Font.Transparent,
                  fontWeight: 400,
                  wordBreak: 'break-word'
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
  const renderPopover = ({ on, style }: { on?: (e: LabelActionEvent) => void; style?: CSSProperties }) => {
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
          background: Colors.Background.Global,
          borderRadius: 999,
          border: `1px solid ${Colors.Background.Border}`,
          ...style
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
          placement={['left', 'right']}
          renderOnParent={false}
          disableNudge={true}
          content={setV => (
            <LabelActionMenu
              onClose={() => {
                setV(false)
              }}
              on={async event => {
                on?.(event)
                switch (event.type) {
                  case 'editOriginal': {
                    setLabelState(s => ({ ...s, editingOrigin: true }))
                    break
                  }
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
          )}
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
        onAttachmentsChange={atts => MetaStore.updateMetaObject({ id: labelMeta.id, attachments: atts })}
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
          <ContentEditor
            onChange={v => {
              setLabelState(s => ({ ...s, addingDescription: false }))
              if (labelMeta) {
                MetaStore.updateMetaObject({ id: labelMeta.id, description: v })
                return
              }
              ObjectStore(type).updateOne({ id: objectId, description: v })
            }}
            value={labelMeta?.description || label?.description}
            placeholder={'Add description...'}
          />
        )}
      </>
    )
  }

  const renderOriginalText = (options: {
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
          style={options.editorStyle}
          value={options.text}
          onChange={v => {
            setLabelState(s => ({ ...s, editingOrigin: false }))
            ObjectStore(type).updateOne({ id: label?.id, selectedText: v })
          }}
        />
      )
    }
    if (!options.text) return null
    return (
      <div
        style={{
          fontSize: 13,
          padding: '4px 8px',
          cursor: 'pointer',
          borderLeft:
            customBackground && label?.color ? `3px solid ${Colors.getAdaptColor(label.color)}` : `3px solid ${Colors.Emphasis.Emphasis}`,
          background: Colors.Background.ButtonHover,
          ...options.style
        }}
        onClick={e => {
          if (!window.getSelection()?.toString()) {
            if (options.clickToEdit) {
              setLabelState(s => ({ ...s, editingOrigin: true }))
              return
            }
            if (options.onClick) {
              options.onClick()
              return
            }
            opts.onNavigate?.()
          }
        }}
      >
        <div
          style={{
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}
        >
          {options.text}
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
    showHoverObjectDetails: false,
    ellipsisLine: 2,
    renderObjectDetailsOnParent: true,
    renderAttOnParent: true,
    showMoreOptions: true,
    containerStyle: { width: '100%' }
  })
}
export default useRenderLabel
