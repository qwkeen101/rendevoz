import { AnimatePopover, Content, Icon, IconWithPopover, WithBorder, ContentEditor } from '@/components'
import { MetaStore, ObjectStore } from '@/api/stores'
import { CSSProperties, useState } from 'react'
import { DraggableElement } from '../../global'
import ClassName from '@/styles/classNames'
import LabelActionMenu, { LabelActionEvent } from '../menus/LabelActionMenu'
import { AttachmentWrapper, useRenderObject } from '../index'
import { useTranslation } from 'react-i18next'
import { Colors } from '@/consts'
import { GlobalInstance, useGlobalAtomValue, useIsIn } from '@/hooks'
import { relatedMetaObjectsMapAtom } from '@/api/stores/meta/meta.store'
import { Rendevoz } from '@/core/rendevoz'
import { ILabel } from '~/typings'
import { ObjectTag } from '@/core'
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
  const renderName = (options?: { style?: CSSProperties }) => {
    return labelState.editingName ? (
      <ContentEditor
        style={{ fontSize: 13, ...options?.style }}
        placeholder={t('general.Add note for label')}
        value={currentLabelHasName ? label?.name : undefined}
        onChange={async v => {
          if (labelMeta) {
            await MetaStore.updateMetaObject({ id: labelMeta.id, name: v })
            setLabelState(s => ({ ...s, editingName: false }))
            return
          }
          await ObjectStore(type).updateOne({ id: objectId, name: v })
          setLabelState(s => ({ ...s, editingName: false }))
        }}
      />
    ) : (
      <DraggableElement draggable={draggable} onDragStart={opts.onDragStart}>
        <div
          className={'font-size-13'}
          style={{
            cursor: 'pointer',
            whiteSpace: 'pre-wrap',
            ...options?.style
          }}
          onClick={() => {
            setLabelState(s => ({ ...s, editingName: true }))
          }}
        >
          {realRelated.size > 0 && (
            <AnimatePopover
              containerStyle={{
                zIndex: '500'
              }}
              align={'center'}
              disableNudge
              positions={['top', 'bottom']}
              content={
                <WithBorder onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }} width={180} padding={6}>
                  <div className={'menu-sub-title'}>{t('general.related objects')}</div>
                  {Array.from(realRelated.values()).map(i => (
                    <LabelRelatedItem metaId={i} key={i} />
                  ))}
                </WithBorder>
              }
            >
              <span
                onClick={e => {
                  e.stopPropagation()
                }}
                style={{
                  padding: '1px 4px',
                  borderRadius: 4,
                  marginRight: 4,
                  background: Colors.Common.SelectColorTransparentLight,
                  color: Colors.Common.SelectColor
                }}
              >
                {realRelated.size}
              </span>
            </AnimatePopover>
          )}
          <span
            style={{
              color: currentLabelHasName ? undefined : Colors.Font.Transparent,
              fontWeight: 400,
              wordBreak: 'break-word'
            }}
          >
            {currentLabelHasName ? label?.name : t('general.Add note')}
          </span>
        </div>
      </DraggableElement>
    )
  }
  const renderPopover = (options?: { on?: (e: LabelActionEvent) => void; style?: CSSProperties; showTag?: boolean }) => {
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
          ...options?.style
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
        {options?.showTag && (
          <Icon
            size={14}
            name={'park-tag-one'}
            onClick={async () => {
              const meta = labelMeta
                ? labelMeta
                : await GlobalInstance.metaOps?.addDraggableAsMeta({
                    type: type,
                    labelId: objectId
                  })
              if (meta) {
                GlobalInstance.metaOps?.quickAdd(meta.id, 'tags')
              }
            }}
            className={ClassName.circleButton(3)}
          />
        )}
        <IconWithPopover
          name="park-more"
          size={14}
          className={ClassName.circleButton(3)}
          placement={['right', 'left']}
          renderOnParent={false}
          disableNudge={true}
          content={setV => (
            <LabelActionMenu
              onClose={() => {
                setV(false)
              }}
              on={async event => {
                options?.on?.(event)
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
            className={'font-size-12 transparent-font'}
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

  const renderTags = (style?: CSSProperties, small?: boolean) => {
    if (!labelMeta) return null
    if (labelMeta && !labelMeta.tags?.length) return null
    const tags = labelMeta.tags!
    return (
      <Content flex gap={4} style={{ flexWrap: 'wrap', ...style }}>
        {tags.map(i => (
          <ObjectTag
            clickOpenGroup
            style={
              small
                ? {
                    fontSize: 11,
                    lineHeight: '16px',
                    padding: '0px 4px'
                  }
                : {
                    fontSize: 12,
                    lineHeight: '18px'
                  }
            }
            key={i}
            tag={i}
            hideDelete
            square
          />
        ))}
      </Content>
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
        className={'font-size-12'}
        style={{
          padding: '3px 6px 3px 8px',
          cursor: 'pointer',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          borderLeft: label?.color ? `3px solid ${Colors.getAdaptColor(label.color)}` : `3px solid ${Colors.Emphasis.Emphasis}`,
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
        {options.text}
      </div>
    )
  }
  return {
    renderName,
    renderPopover,
    renderAttachment,
    renderDescription,
    renderOriginalText,
    renderTags,
    labelMeta,
    label,
    setDraggingDetails: Rendevoz.Actions.State.Drag.setDraggingDetails,
    ref
  }
}

const LabelRelatedItem = ({ metaId }: { metaId: number }) => {
  const { renderInline } = useRenderObject({ metaObjectId: metaId })
  return renderInline({
    ellipsisLine: 2,
    renderObjectDetailsOnParent: true,
    renderAttOnParent: true,
    containerStyle: { width: '100%', fontSize: 13 }
  })
}
export default useRenderLabel
