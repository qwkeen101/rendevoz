import { Button, Content, Icon } from '@/components'
import AttachmentObject from './AttachmentObject'
import { CSSProperties, useRef, useState } from 'react'
import { css } from '@emotion/css'
import Colors from '@/consts/colors'
import ClassName from '@/styles/classNames'
import { Reorder } from 'framer-motion'
import useDropObjectArea from './useDropObjectArea'
import { MetaObject } from '~/typings'
import { useTranslation } from 'react-i18next'
import Id from '@/utils/id'
import { Rendevoz } from '../rendevoz'
import { GlobalInstance } from '@/hooks'
import { MetaStore } from '@/api/stores'

export interface AttachmentListProps {
  attachments?: MetaObject['attachments']
  onAttachmentsChange?: (atts: MetaObject['attachments']) => void
  maxVisibleAttachments?: number
  parentName?: string
  style?: CSSProperties
  closeIcon?: boolean
  onClose?: VoidFunction
  innerContainerStyle?: CSSProperties
  parentMetaId: number
  renderAttOnParent?: boolean
  renderObjectDetailsOnParent?: boolean
  showField?: boolean
}

const legendClazz = css({
  transform: 'translateY(-6px)',
  height: 0,
  width: 'fit-content',
  fontSize: '0.857rem',
  marginBottom: 0,
  color: Colors.Font.Secondary,
  fontWeight: 600,
  fontFamily: 'Muli',
  lineHeight: 1,
  padding: '0px 2px'
})

const AttachmentList = ({
  attachments = [],
  maxVisibleAttachments = 3,
  onAttachmentsChange,
  parentName,
  parentMetaId,
  style,
  innerContainerStyle,
  showField = true,
  closeIcon,
  onClose,
  renderAttOnParent,
  renderObjectDetailsOnParent
}: AttachmentListProps) => {
  const { t } = useTranslation()
  const [listState, setListState] = useState<{
    showMore: boolean
    isEditing: boolean
    isReordering: boolean
    isSelecting: boolean
    dragOver: boolean
    selected: Set<(MetaObject['attachments'] & object[])[0]>
  }>({
    showMore: false,
    dragOver: false,
    isEditing: false,
    isSelecting: false,
    isReordering: false,
    selected: new Set()
  })
  const containerRef = useRef<HTMLFieldSetElement>(null)
  useDropObjectArea(containerRef, {
    onDrop: async data => {
      setTimeout(() => setListState(s => ({ ...s, dragOver: false })), 20)
      Rendevoz.Events.Emit.GlobalEventEmitter.emitWithCallback('global', {
        type: 'globalDropNeedFurtherProcess',
        data: {
          dropOn: {
            dropOn: 'attachment',
            parentMetaId: parentMetaId
          },
          draggingElement: Rendevoz.Actions.State.Drag.getDraggingDetails()
        }
      }).then((meta: MetaObject | undefined) => {
        if (attachments.some(i => i.id === meta?.id)) return
        if (meta) {
          onAttachmentsChange?.([{ type: meta.type, id: meta.id, createdAt: Date.now() }, ...attachments])
        }
      })
    },
    onDragOver: element => {
      setListState(s => ({ ...s, dragOver: true }))
    },
    onDragLeave: () => setListState(s => ({ ...s, dragOver: false }))
  })
  const { showMore, isReordering, isSelecting, selected, dragOver, isEditing } = listState
  return (
    <fieldset
      ref={containerRef}
      style={{
        padding: '12px 12px 8px',
        borderRadius: 8,
        width: '100%',
        transition: 'box-shadow 0.25s ease',
        position: 'relative',
        boxShadow: dragOver ? '0 0 0 2px var(--select-color)' : `0 0 0 1px ${Colors.Background.Border}`,
        ...style
      }}
    >
      {closeIcon && (
        <Icon
          size={11}
          name="park-close"
          onClick={onClose}
          containerStyle={{ position: 'absolute', top: -8, right: 8 }}
          className={ClassName.circleButton(3)}
        />
      )}
      {showField && <legend className={legendClazz}>{parentName || t('general.attachments')}</legend>}
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          overflowX: 'hidden',
          ...innerContainerStyle
        }}
      >
        {attachments.length === 0 && (
          <Content
            flex
            column
            alignItems={'center'}
            style={{
              padding: '24px',
              textAlign: 'center',
              margin: 'auto'
            }}
            className={'transparent-font font-size-13'}
          >
            <div>{t('general.drag object here to add attachment')}</div>
            <Button.IconButton
              icon={'park-plus'}
              text={t('general.New')}
              style={{
                width: 'fit-content',
                marginTop: '6px'
              }}
              onClick={() => {
                GlobalInstance.metaOps?.createObjects(undefined, o => {
                  MetaStore.addMetaAsAttachment(o.id, parentMetaId)
                })
              }}
            />
          </Content>
        )}
        <Reorder.Group
          as="div"
          axis="y"
          onPointerUp={() => {
            if (listState.isReordering) {
              setTimeout(() => setListState(s => ({ ...s, isReordering: false })), 500)
            }
          }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2
          }}
          onReorder={items => {
            if (!listState.isReordering) {
              setListState(s => ({ ...s, isReordering: true }))
            }
            onAttachmentsChange?.(items)
          }}
          values={attachments}
        >
          {attachments.slice(0, showMore || isEditing ? attachments.length : maxVisibleAttachments).map(i => (
            <Reorder.Item
              // layout={isEditing ? true : 'size'}
              drag={isEditing ? true : false}
              layoutDependency={isEditing}
              as="div"
              value={i}
              key={`${i.id}_${i.createdAt}`}
            >
              <AttachmentObject
                renderObjectDetailsOnParent={renderObjectDetailsOnParent}
                selected={selected.has(i)}
                showSelect={isSelecting}
                renderAttOnParent={renderAttOnParent}
                onSelect={v => {
                  if (isReordering) return
                  console.log(i)
                  if (v) {
                    selected.add(i)
                  } else {
                    selected.delete(i)
                  }
                  setListState(s => ({ ...s }))
                }}
                attachment={i}
                onChange={a => {
                  const idx = attachments.findIndex(i => i.id === a.id && i.createdAt === a.createdAt)
                  if (idx >= 0) {
                    const copy = attachments.slice()
                    copy.splice(idx, 1, a)
                    onAttachmentsChange?.(copy)
                  }
                }}
              />
            </Reorder.Item>
          ))}
        </Reorder.Group>
        {attachments.length > 0 && (
          <Content flex alignItems="center" justifyContent="space-between" gap={6} className={'font-size-12 transparent-font'}>
            {attachments.length ? <div>{t('general.num attachments', { num: attachments.length })}</div> : null}
            <Content
              className={css({
                '>div': {
                  cursor: 'pointer',
                  ':hover': {
                    textDecoration: 'underline'
                  }
                }
              })}
              flex
              gap={6}
            >
              <div
                onClick={() => {
                  GlobalInstance.metaOps?.createObject().then(o => {
                    MetaStore.addMetaAsAttachment(o.id, parentMetaId)
                  })
                }}
              >
                {t('general.New')}
              </div>
              {selected.size > 0 && (
                <div
                  onClick={() => {
                    onAttachmentsChange?.(attachments.filter(i => !selected.has(i)))
                    selected.clear()
                  }}
                >
                  {t('general.delete selected')}
                </div>
              )}
              {isEditing && (
                <div
                  onClick={() =>
                    onAttachmentsChange?.([
                      ...attachments,
                      {
                        type: 'attachmentText',
                        text: '',
                        id: Id.getId(),
                        createdAt: Date.now()
                      }
                    ])
                  }
                >
                  {t('general.add text')}
                </div>
              )}
              <div
                onClick={() =>
                  setListState(s => ({
                    ...s,
                    isEditing: !s.isEditing,
                    isSelecting: !s.isSelecting
                  }))
                }
              >
                {isEditing ? t('general.return') : t('general.edit')}
              </div>
              {attachments.length > maxVisibleAttachments &&
                !isEditing &&
                (!showMore ? (
                  <div onClick={() => setListState(s => ({ ...s, showMore: true }))}>{t('editor.show more')}</div>
                ) : (
                  <div onClick={() => setListState(s => ({ ...s, showMore: false }))}>{t('editor.show less')}</div>
                ))}
            </Content>
          </Content>
        )}
      </div>
    </fieldset>
  )
}

export default AttachmentList
