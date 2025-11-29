import { Button, Content, Icon } from '@/components'
import AttachmentObject from './AttachmentObject'
import { CSSProperties, useRef, useState } from 'react'
import { css } from '@emotion/css'
import ClassName from '@/styles/classNames'
import { Reorder } from 'framer-motion'
import { MetaObject } from '~/typings'
import { useTranslation } from 'react-i18next'
import Id from '@/utils/id'
import { MetaStore } from '@/api/stores'
import usePasteMetaObject from '@/core/object/usePasteMetaObject'
import queueTurnUnhidden from '@/api/stores/meta/queueTurnUnhidden'

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
const AttachmentList = ({
  attachments = [],
  maxVisibleAttachments = 3,
  onAttachmentsChange,
  parentMetaId,
  style,
  innerContainerStyle,
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
    selected: Set<(MetaObject['attachments'] & object[])[0]>
  }>({
    showMore: false,
    isEditing: false,
    isSelecting: false,
    isReordering: false,
    selected: new Set()
  })
  const containerRef = useRef<HTMLDivElement>(null)
  usePasteMetaObject(containerRef, objs => {
    MetaStore.addMetaAsAttachment(
      objs.map(i => i.id),
      parentMetaId
    )
  })
  const { showMore, isReordering, isSelecting, selected, isEditing } = listState
  return (
    <div ref={containerRef} className={'w-full relative'} style={style}>
      {closeIcon && (
        <Icon
          size={11}
          name="park-close"
          onClick={onClose}
          containerStyle={{ position: 'absolute', top: -8, right: 8 }}
          className={ClassName.circleButton(3)}
        />
      )}
      <div className={'flex flex-col w-full justify-between gap-2 min-h-60 overflow-x-hidden'} style={innerContainerStyle}>
        {attachments.length === 0 && (
          <div className={'transparent-font gap-2 my-auto items-center flex-col justify-center flex p-8'}>
            <div>{t('general.Drop object to add attachment')}</div>
            <Button.IconButton
              icon={'park-plus'}
              text={t('general.New')}
              style={{
                width: 'fit-content'
              }}
              onClick={() => {
                Global.metaOps.createObjects?.(undefined, o => {
                  MetaStore.addMetaAsAttachment(o.id, parentMetaId)
                  MetaStore.updateMetaObject({ id: o.id, hidden: true })
                })
              }}
            />
          </div>
        )}
        <Reorder.Group
          as="div"
          axis="y"
          onPointerUp={() => {
            if (listState.isReordering) {
              setTimeout(() => setListState(s => ({ ...s, isReordering: false })), 500)
            }
          }}
          className={'flex flex-col gap-1.5'}
          onReorder={items => {
            if (!listState.isReordering) {
              setListState(s => ({ ...s, isReordering: true }))
            }
            onAttachmentsChange?.(items)
          }}
          values={attachments}
        >
          {attachments.slice(0, showMore || isEditing ? attachments.length : maxVisibleAttachments).map(i => (
            <Reorder.Item drag={isEditing ? true : false} layoutDependency={isEditing} as="div" value={i} key={`${i.id}_${i.createdAt}`}>
              <AttachmentObject
                renderObjectDetailsOnParent={renderObjectDetailsOnParent}
                selected={selected.has(i)}
                showSelect={isSelecting}
                renderAttOnParent={renderAttOnParent}
                onSelect={v => {
                  if (isReordering) return
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
          <div className={'transparent-font flex items-center justify-between em:text-sm'}>
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
                  Global.metaOps?.createObjects(undefined, o => {
                    MetaStore.updateMetaObject({ id: o.id, hidden: true })
                    MetaStore.addMetaAsAttachment(o.id, parentMetaId)
                  })
                }}
              >
                {t('general.New')}
              </div>
              {selected.size > 0 && isEditing && (
                <div
                  onClick={() => {
                    onAttachmentsChange?.(attachments.filter(i => !selected.has(i)))
                    selected.forEach(i => {
                      if (i.type !== 'attachmentText') {
                        MetaStore.deleteMetaObject(i.id)
                        queueTurnUnhidden({
                          metaId: i.id,
                          type: 'object'
                        })
                      }
                    })
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
          </div>
        )}
      </div>
    </div>
  )
}

export default AttachmentList
