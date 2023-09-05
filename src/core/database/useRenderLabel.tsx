import { AnimatePopover, Content, IconWithPopover, Tooltip, WithBorder } from '@/components'
import { MetaStore, ObjectStore } from '@/stores'
import { CSSProperties, useState } from 'react'
import NameEditor from '../video/VideoNameEditor'
import { DraggableElement } from '../global'
import { css } from '@emotion/css'
import ClassName from '@/styles/classNames'
import FontSize from '@/consts/font'
import LabelActionMenu, { LabelActionEvent } from './LabelActionMenu'
import { AttachmentWrapper, useRenderObject } from '.'
import BorderInput from '@/components/base/BorderInput'
import { useTranslation } from 'react-i18next'
import { IDraggableElement } from '~/typings/globalInstances/dragDrop'
import { Consts } from 'rendevoz'
import { Colors } from '@/consts'
import { useGlobalAtomValue, useSelectGlobalAtomValue } from '@/hooks'
import { relatedMetaObjectsMapAtom } from '@/stores/meta.store'
import { SettingAtom } from '@/core'
import { keyboard } from '@/core/database/useRenderObject'
import { toast } from 'react-hot-toast'

const useRenderLabel = (opts: {
  objectId: number
  type: 'videoLabel' | 'pdfLabel' | 'noteLabel' | 'webpageLabel'
  draggable?: boolean
  onDragStart?: VoidFunction
}) => {
  const { objectId, type, draggable } = opts
  const label = ObjectStore(opts.type).useValue(opts.objectId)
  const labelMeta = MetaStore.useObjectToMetaValue(opts.objectId)
  const { t } = useTranslation()
  const [draggingDetails, setDraggingDetails] = useState<IDraggableElement>()
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

  const relatedMap = useGlobalAtomValue(relatedMetaObjectsMapAtom)
  const metaRelated = labelMeta && relatedMap.get(labelMeta.id)
  const shouldShouldOriginal = useSelectGlobalAtomValue(SettingAtom, s => s.label.showOriginalText)
  const renderName = ({ onNameClick }: { onNameClick?: (name?: string) => void }) => {
    return (
      <Content flex column auto>
        {labelState.editingName ? (
          <NameEditor
            value={label?.name || 'Unnamed Label'}
            onChange={v => {
              ObjectStore(type).updateOne({ id: objectId, name: v })
              setLabelState(s => ({ ...s, editingName: false }))
            }}
          />
        ) : (
          <DraggableElement draggable={draggingDetails && draggable} onDragStart={opts.onDragStart} draggingDetails={draggingDetails}>
            <div
              className={ClassName.title(FontSize['13px'])}
              style={{
                cursor: 'pointer',
                width: 'fit-content',
                whiteSpace: 'pre-wrap',
                color: labelMeta ? labelMeta.color || Colors.Font.Link : undefined
              }}
            >
              {metaRelated && (
                <AnimatePopover
                  content={
                    <WithBorder style={{ fontSize: '0.85rem', maxWidth: 400 }} padding={6}>
                      <div className={ClassName.description()}>{t('general.related objects')}</div>
                      {Array.from(metaRelated.values()).map(i => (
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
                      {metaRelated.size}
                    </span>
                  </Tooltip>
                </AnimatePopover>
              )}
              <span
                onContextMenu={() => setLabelState(s => ({ ...s, editingName: true }))}
                onClick={() => {
                  if (keyboard.ctrl) {
                    if (labelMeta) {
                      const link = `rendevoz://object/${labelMeta?.id}`
                      navigator.clipboard.writeText(link)
                      toast.success(
                        <Content className={ClassName.description()}>
                          <div style={{ textTransform: 'none' }}>{t('general.link is generated for this object')}!</div>
                          <div style={{ userSelect: 'all', textTransform: 'none' }}>{link}</div>
                        </Content>
                      )
                    } else {
                      MetaStore.addMetaObject(
                        { type: type, name: label?.name, description: label?.description, objectId: objectId },
                        true
                      ).then(meta => {
                        const link = `rendevoz://object/${meta?.id}`
                        navigator.clipboard.writeText(link)
                        toast.success(
                          <Content className={ClassName.description()}>
                            <div>{t('general.link is generated for this object')}!</div>
                            <div style={{ userSelect: 'all' }}>{link}</div>
                          </Content>
                        )
                      })
                    }
                    return
                  } else {
                    onNameClick?.(label?.name)
                  }
                }}
              >
                {label?.name || 'Unnamed Label'}
              </span>
            </div>
          </DraggableElement>
        )}
      </Content>
    )
  }
  const renderPopover = ({ on }: { on?: (e: LabelActionEvent) => void }) => {
    return (
      <IconWithPopover
        name="park-more"
        className={ClassName.circleButton()}
        closeOnContentClick="[role='button']"
        placement={['right', 'left']}
        renderOnParent={false}
        content={
          <LabelActionMenu
            on={event => {
              on?.(event)
              switch (event.type) {
                case 'addAttachment':
                  setLabelState(s => ({ ...s, addingAttachment: true }))
                  break
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
  }) => {
    if (!shouldShouldOriginal) {
      return null
    }
    if (labelState.editingOrigin) {
      return (
        <NameEditor
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
        onContextMenu={() => setLabelState(s => ({ ...s, editingOrigin: true }))}
        style={{
          fontSize: FontSize['12px'],
          padding: '4px 8px',
          borderRadius: 4,
          background: Colors.Background.ButtonHover,
          ...opts.style
        }}
      >
        <div
          style={{
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}
          className={labelState.showMoreText || opts.ellipis === false ? undefined : ClassName.ellipsisFont(3)}
        >
          {opts.text}
        </div>
        <div
          style={{
            marginLeft: 'auto',
            display: 'flex',
            gap: 6,
            textAlign: 'end',
            fontSize: FontSize['12px'],
            width: 'fit-content'
          }}
        >
          {opts.showEdit !== false && (
            <div style={{ cursor: 'pointer' }} onClick={() => setLabelState(s => ({ ...s, editingOrigin: true }))}>
              {t('general.edit')}
            </div>
          )}
          {opts.text?.length > 120 && opts.ellipis !== false && (
            <div style={{ cursor: 'pointer' }} onClick={() => setLabelState(s => ({ ...s, showMoreText: !s.showMoreText }))}>
              {labelState.showMoreText ? t('editor.show less') : t('editor.show more')}
            </div>
          )}
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
    setDraggingDetails
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
