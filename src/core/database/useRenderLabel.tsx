import { Content, IconWithPopover } from '@/components'
import { MetaStore, ObjectStore } from '@/stores'
import { ObjectFamily } from '@/stores/object.store'
import { CSSProperties, useState } from 'react'
import { MetaObject } from '~/typings'
import NameEditor from '../video/VideoNameEditor'
import { AvaliableGlobalDraggingElements, DraggableElement } from '../global'
import { css } from '@emotion/css'
import ClassName from '@/styles/classNames'
import FontSize from '@/consts/font'
import LabelActionMenu, { LabelActionEvent } from './LabelActionMenu'
import { AttachmentWrapper } from '.'
import BorderInput from '@/components/base/BorderInput'
import { useTranslation } from 'react-i18next'

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
  const [draggingDetails, setDraggingDetails] = useState<AvaliableGlobalDraggingElements>()
  const [labelState, setLabelState] = useState<{
    addingAttachment: boolean
    addingDescription: boolean
    focused: boolean
    editingName: boolean
  }>({
    focused: false,
    editingName: false,
    addingDescription: false,
    addingAttachment: false
  })

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
              onClick={() => onNameClick?.(label?.name)}
              className={css([ClassName.ellipsisFont(2), ClassName.title(FontSize['13px'])])}
              style={{ cursor: 'pointer', width: 'fit-content', textTransform: 'none' }}
            >
              {label?.name || 'Unnamed Label'}
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
                  setLabelState(s => ({ ...s, addingDescription: !s.addingDescription }))
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
            style={{ whiteSpace: 'pre-wrap', textTransform: 'none', wordBreak: 'break-all', ...style }}
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
            onSubmit={() => setLabelState(s => ({ ...s, addingDescription: false }))}
            onChange={e => typeof e === 'string' && ObjectStore(type).updateOne({ id: objectId, description: e })}
          />
        )}
      </>
    )
  }
  return {
    renderName,
    renderPopover,
    renderAttachment,
    renderDescription,
    labelMeta,
    label,
    setDraggingDetails
  }
}

export default useRenderLabel
