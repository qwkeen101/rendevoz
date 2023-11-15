import { FC, memo, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { css } from '@emotion/css'
import { GlobalInstance, useToggle } from '@/hooks'
import MetaKnowledgeCard from './KnowledgeCard'
import classNames from 'classnames'
import ClassName from '@/styles/classNames'
import { AnimatePopover, Button, Content, Icon, Panel, TabPane, Tabs, Tooltip, WithBorder } from '@/components'
import DateFormat from '@/utils/dateFormat'
import {
  indexedMetaLinksAtom,
  indexedMetaObjectsAtom,
  metaLinksAtom,
  metaObjectsAtom,
  relatedMetaObjectsMapAtom
} from '@/api/stores/meta.store'
import Modal from '@/components/base/Modal'
import useCardDrag from './useCardDrag'
import { AttachmentWrapper, DraggableElement, GlobalGraphInstance, ObjectTag, useRenderObject } from '@/core'
import MetaNoteCard from './NoteCard'
import MetaDocumentCard from './DocumentCard'
import { Flipped, spring } from 'react-flip-toolkit'
import { globalStore, MetaStore } from '@/api/stores'
import { MetaObject } from 'rendevoz'
import { MetaDatabaseCardProps } from './types'
import MetaObjectCard from './ObjectCard'
import { selectAtom } from 'jotai/utils'
import { useGlobalAtomValue } from '@/hooks/jotai'
import ObjectForm from '@/components/form/ObjectForm'
import { PartialWithId } from '@/types'
import { useTranslation } from 'react-i18next'
import { GlobalEventEmitter } from '@/events'
import Colors from '@/consts/colors'
import { Zindexes } from '@/consts'
import FontSize from '@/consts/font'
import { GlobalImagePreviewerInstance } from '@/core/global/GlobalImagePreviewer'
import FromRenderer from '../renderer/object/FromRenderer'
import _ from 'lodash'
import { Rendevoz } from '@/core/rendevoz'
import { toast } from 'react-hot-toast'
import HoverObjectDetails from '@/core/object/HoverObjectDetails'
import Select from '@/components/base/select'

export const TypeToTypeName: {
  [key in MetaObject['type']]?: string
} = {
  pdfLabel: 'pdf label',
  note: 'note',
  pdf: 'pdf',
  image: 'image',
  normal: 'object',
  whiteboard: 'whiteboard',
  video: 'video',
  audio: 'audio',
  webpage: 'webpage',
  noteLabel: 'note label',
  noteBlock: 'note block',
  webpageLabel: 'webpage label',
  localFile: 'local file',
  videoLabel: 'video label',
  syncedBlock: 'syncedBlock',
  audioLabel: 'audioLabel',
  group: 'group'
}
export const DatabaseCard: FC<{
  index?: number
  metaObject: MetaObject
}> = memo(({ metaObject: _m }) => {
  const metaAtom = useMemo(() => selectAtom(metaObjectsAtom, m => m.get(_m.id)), [_m.id])
  const metaObject = useGlobalAtomValue(metaAtom)
  const relatedAtom = useMemo(() => selectAtom(relatedMetaObjectsMapAtom, r => r.get(_m.id)), [_m.id])
  const set = useGlobalAtomValue(relatedAtom)
  const relatedNumber = set?.size
  const [showIcon, setShowIcon] = useState(false)
  const [showPopover, setShowPopover] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const cover = metaObject?.coverImgSrc
  const [innerCover, setInnerCover] = useState(cover)
  const showImage = !!cover || !!innerCover
  const { updateMetaObject } = MetaStore
  const iconRef = useRef<HTMLDivElement>(null)
  const { isCardDraggingInside } = useCardDrag(metaObject, iconRef, containerRef.current)

  const { t } = useTranslation()

  const renderCardContent = () => {
    if (!metaObject) return null
    switch (metaObject?.type) {
      case 'note':
        return <MetaNoteCard metaObject={metaObject} renderTitleAndDescription={renderTitleAndDescription} />
      case 'pdf':
        return <MetaDocumentCard metaObject={metaObject} renderTitleAndDescription={renderTitleAndDescription} />
      case 'normal':
        return <MetaObjectCard metaObject={metaObject} renderTitleAndDescription={renderTitleAndDescription} />
      default:
        return <MetaKnowledgeCard metaObject={metaObject} renderTitleAndDescription={renderTitleAndDescription} />
    }
  }

  const renderToolbar = () => {
    return (
      <Content
        flex
        alignItems="center"
        justifyContent="space-between"
        className={css({
          fontSize: FontSize['12px']
        })}
      >
        <Content flex gap={6} alignItems="baseline">
          <span className={css({ fontSize: FontSize['20px'], fontWeight: 650 })}>{relatedNumber || 0}</span>
          <span className={css({ fontSize: FontSize['11px'], fontWeight: 500 })}>{t('general.related objects')}</span>
        </Content>

        <AnimatePopover
          visible={showPopover}
          innerRef={iconRef}
          onClickOutside={() => setShowPopover(false)}
          positions={['bottom']}
          align="start"
          padding={10}
          content={<WithBorder>{renderPopover()}</WithBorder>}
          disableIntersection
          containerStyle={{ zIndex: '9999' }}
        >
          <Tooltip
            content={
              <Content
                flex
                column
                alignItems="center"
                style={{
                  textTransform: 'capitalize',
                  fontSize: FontSize['12px'],
                  fontFamily: 'Muli'
                }}
              >
                <div>Click to open menu</div>
                <div>Drag to move object</div>
              </Content>
            }
          >
            <Icon
              onClick={() => setShowPopover(!showPopover)}
              size={18}
              name="park-drag"
              className={ClassName.circleButton(3)}
              style={{
                opacity: showIcon || showPopover ? 1 : 0
              }}
            />
          </Tooltip>
        </AnimatePopover>
      </Content>
    )
  }

  const renderPopover = () => <ObjectActionPopover metaObjectId={_m.id} onClose={() => setShowPopover(false)} />

  const renderEdit = () => (
    <Modal visible={showEdit} onClose={() => setShowEdit(false)} noStyle>
      <ObjectForm
        onBack={() => setShowEdit(false)}
        initialObject={metaObject}
        onSubmit={newMeta => {
          setShowEdit(false)
          updateMetaObject(newMeta as PartialWithId<MetaObject>)
        }}
      />
    </Modal>
  )
  const renderTitleAndDescription: MetaDatabaseCardProps['renderTitleAndDescription'] = ({ title, description, onTitleClick }) => {
    return (
      <Content flex column>
        <Content className={TitleWrapperClassName}>
          <div className={TitleClassName} onClick={onTitleClick} style={{ textTransform: 'none' }}>
            {title}
          </div>
          {description?.length && (
            <div
              style={{
                whiteSpace: 'pre-line',
                marginTop: 8,
                textTransform: 'none'
              }}
              className={css([ClassName.description(FontSize['14px']), ClassName.ellipsisFont(6)])}
            >
              {description}
            </div>
          )}
        </Content>
      </Content>
    )
  }
  const onElementAppear = (el, index) =>
    spring({
      onUpdate: val => {
        el.style.opacity = val
      },
      delay: index * 50
    })
  const onExit = (el, index, removeElement) => {
    spring({
      config: { overshootClamping: true },
      onUpdate: val => {
        el.style.transform = `scaleX(${1 - val})`
      },
      delay: index * 50,
      onComplete: removeElement
    })

    return () => {
      el.style.opacity = ''
      removeElement()
    }
  }
  if (!metaObject) return null
  return (
    <Flipped onAppear={onElementAppear} onExit={onExit} flipId={_m.id} key={metaObject.id}>
      <div
        ref={containerRef}
        onPointerEnter={() => setShowIcon(true)}
        onPointerLeave={() => setShowIcon(false)}
        style={{ gridRowEnd: showImage ? 'span 2' : undefined }}
        className={css({
          borderRadius: 16,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          willChange: 'transform'
        })}
      >
        {renderEdit()}
        <motion.div
          style={{
            pointerEvents: isCardDraggingInside ? 'auto' : 'none'
          }}
          initial={{ backgroundColor: 'rgba(255,255,255,0)' }}
          animate={{
            backgroundColor: isCardDraggingInside ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0)',
            backdropFilter: isCardDraggingInside ? 'blur(4px)' : 'blur(0px)'
          }}
          transition={{ duration: 0.3 }}
          className={css({
            position: 'absolute',
            left: 0,
            top: 0,
            width: '100%',
            height: '100%',
            borderRadius: 16,
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: FontSize['18px'],
            fontWeight: 600
          })}
        >
          <div
            style={{
              opacity: isCardDraggingInside ? 1 : 0,
              transition: 'opacity 0.3s ease'
            }}
          >
            {Rendevoz.Actions.State.Drag.getDraggingDetails()?.type === 'image' ? 'Drop to change cover' : 'Drop to add Link'}
          </div>
        </motion.div>
        <Content
          flex
          column
          className={css({
            transition: 'box-shadow 0.3s cubic-bezier(0.2, 0.91, 0.85, 0.96) 0s, background-color 0.3s ease 0s',
            boxShadow: 'rgba(100, 100, 111, 0.2) 0px 7px 29px 0px',
            ':hover': {
              boxShadow: 'rgba(100, 100, 111, 0.35) 0px 7px 29px 0px'
            }
          })}
          style={{
            height: 'fit-content',
            overflow: 'hidden',
            borderRadius: 16,
            cursor: 'pointer'
          }}
        >
          {showImage && (
            <img
              onClick={() => GlobalImagePreviewerInstance.open?.(innerCover || cover)}
              src={cover}
              style={{ height: '100%', objectFit: 'cover', maxHeight: 250 }}
            />
          )}
          <Content
            flex
            column
            fullWidth
            className={css({
              background: Colors.Background.Linear
            })}
          >
            <div
              className={css({
                position: 'relative',
                padding: '16px',
                zIndex: 1
              })}
            >
              <div
                style={{
                  fontWeight: 600,
                  fontSize: FontSize['11px'],
                  marginBottom: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  textTransform: 'uppercase'
                }}
              >
                <span>{t(`general.${TypeToTypeName[metaObject.type] || 'object'}`)}</span>
                <span
                  style={{
                    display: 'flex',
                    gap: 5,
                    fontSize: FontSize['10px'],
                    alignItems: 'center',
                    lineHeight: 1
                  }}
                >
                  <Icon size={13} name="park-time" />
                  {t('general.ago', {
                    time: DateFormat.formatDistanceToNowStrict(metaObject.createdAt)
                  })}
                </span>
              </div>
              {metaObject.tags && metaObject.tags.length > 0 && (
                <Content flex gap={4} style={{ flexWrap: 'wrap', marginBottom: 4 }}>
                  {metaObject.tags?.map(i => <ObjectTag small hideSize hideDelete tag={i} key={i} />)}
                </Content>
              )}
              <div>{renderCardContent()}</div>
              <FromRenderer
                style={{
                  marginTop: 8
                }}
                metaObject={metaObject}
              />
            </div>
            <div
              className={css({
                padding: '0 16px 8px',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end'
              })}
            >
              {renderToolbar()}
            </div>
          </Content>
        </Content>
      </div>
    </Flipped>
  )
})

export const ObjectActionPopover: FC<
  Partial<{
    onClose: VoidFunction
    onEdit: VoidFunction
    onPin: VoidFunction
    onGraph: VoidFunction
    onDelete: VoidFunction
    onJump: VoidFunction
    onGraphPin: VoidFunction
    onShowRelated: VoidFunction
    visibility: {
      jumpToVisible?: boolean
      graphPinVisible?: boolean
      showRelatedVisible?: boolean
      graphPinned?: boolean
      relatedNum?: number
    }
  }> & { metaObjectId: number }
> = ({ onClose, onEdit, onPin, onGraph, onDelete, metaObjectId, visibility, onJump, onGraphPin, onShowRelated }) => {
  const { updateMetaObject, deleteMetaObject } = MetaStore
  const { t } = useTranslation()
  const [attachmentVisible, toggleAttachmentVisible] = useToggle(false)
  const metaObject = MetaStore.useValue(metaObjectId)
  const metaAttToMetaIds = globalStore.get(indexedMetaObjectsAtom)?.metaAttachmentIdToMetaIdsMap
  const containerRef = useRef<HTMLDivElement>(null)
  const of = metaAttToMetaIds?.get(metaObjectId)?.size
  if (!metaObject) return null
  return (
    <Content flex column style={{ padding: 4, fontWeight: 500, width: 180, fontSize: 14 }} ref={containerRef} role="object-popover-panel">
      {visibility?.jumpToVisible && <Button.IconButton onClick={onJump} text="Focus" icon="park-share-two" />}
      {visibility?.graphPinVisible && (
        <Button.IconButton
          icon="park-pin"
          text={visibility.graphPinned ? t('graph.unpin') : t('graph.pin on graph')}
          style={{ color: visibility.graphPinned ? 'color' : undefined }}
          onClick={onGraphPin}
        />
      )}
      {visibility?.showRelatedVisible && (
        <Button.IconButton
          onClick={onShowRelated}
          text={t(`graph.show more related nodes`, {
            num: visibility.relatedNum
          })}
          icon="park-circle-four"
        />
      )}
      {GlobalInstance.metaOps?.canPreview(metaObject) && (
        <Button.IconButton
          text={t('general.Preview')}
          icon="park-preview-open"
          onClick={() => {
            onClose?.()
            GlobalInstance.metaOps?.preview(metaObjectId)
          }}
        />
      )}
      <Button.IconButton
        text={t('general.show object info')}
        icon="park-info"
        onClick={() => {
          onClose?.()
          Rendevoz.Actions.Open.openSidebarObjectDetails(metaObjectId)
        }}
      />
      <Button.IconButton
        text={t('general.edit')}
        icon="park-edit"
        onClick={() => {
          onClose?.()
          onEdit?.()
          Rendevoz.Actions.Open.Meta.openEditMetaDialog(metaObjectId)
        }}
      />
      <Button.IconButton
        onClick={() => {
          updateMetaObject({ id: metaObject.id, pinned: !metaObject.pinned })
          onPin?.()
          onClose?.()
        }}
        icon="park-like"
        text={metaObject.pinned ? t('general.unpin') : t('general.pin')}
      />
      <Button.IconButton
        onClick={() => {
          GlobalInstance.collectionOps?.addMetaIntoCollection(metaObjectId)
          onClose?.()
        }}
        icon="park-folder-close"
        text={t('general.Assign to collection')}
      />
      {metaObject.attachments?.length || metaAttToMetaIds?.get(metaObjectId)?.size ? (
        <AnimatePopover
          positions={['right', 'left']}
          visible={attachmentVisible}
          onClickOutside={toggleAttachmentVisible}
          boundaryInset={20}
          padding={10}
          containerStyle={{
            zIndex: String(Zindexes.Tooltip)
          }}
          reposition
          boundaryElement={document.body}
          parentElement={containerRef.current}
          content={
            <WithBorder
              onClick={e => e.stopPropagation()}
              padding={8}
              style={{
                width: 320
              }}
            >
              <AttachmentPanel metaId={metaObjectId} />
            </WithBorder>
          }
        >
          <Button.IconButton
            text={`${
              metaObject.attachments?.length
                ? t('general.with attachment', {
                    with: metaObject.attachments.length
                  }) + (of ? ', ' : '')
                : ''
            }${of ? t('general.of attachment', { of }) : ''}`}
            icon="park-link"
            onClick={e => {
              toggleAttachmentVisible()
              e.preventDefault()
              e.stopPropagation()
            }}
          ></Button.IconButton>
        </AnimatePopover>
      ) : null}
      <Button.IconButton
        text={t('general.generate link')}
        onClick={() => {
          GlobalInstance.metaOps?.copyLink(metaObjectId)
        }}
        icon="park-link-two"
      />
      <Button.IconButton
        text={t('general.delete')}
        dangerous
        onClick={() => {
          deleteMetaObject(metaObject.id, false, true)
          onDelete?.()
          onClose?.()
        }}
        icon="park-delete"
      />
    </Content>
  )
}

const AttachmentPanel = memo(({ metaId }: { metaId: number }) => {
  const metaAttToMetaIds = globalStore.get(indexedMetaObjectsAtom)?.metaAttachmentIdToMetaIdsMap.get(metaId)
  const metaObject = MetaStore.useValue(metaId)
  const { t } = useTranslation()
  return (
    <Content flex column gap={8}>
      {metaObject?.attachments?.length ? (
        <>
          <div className={ClassName.description(FontSize['12px'])}>
            {t('general.with attachment', {
              with: metaObject?.attachments?.length
            })}
          </div>
          <AttachmentWrapper
            style={{ marginTop: 6 }}
            renderAttOnParent
            visible
            maxVisibleAttachments={5}
            metaId={metaId}
            parentMetaId={metaId}
          />
        </>
      ) : null}
      {metaAttToMetaIds?.size ? (
        <>
          <div className={ClassName.description(FontSize['12px'])}>{t('general.of attachment', { of: metaAttToMetaIds.size })}</div>
          <div style={{ marginTop: -4 }}>
            {Array.from(metaAttToMetaIds.values()).map(i => (
              <AttachmentObject metaId={i} key={i} />
            ))}
          </div>
        </>
      ) : null}
    </Content>
  )
})

const AttachmentObject = memo(({ metaId }: { metaId: number }) => {
  const { renderInline } = useRenderObject({ metaObjectId: metaId })
  return renderInline({
    showHoverObjectDetails: true,
    showCircle: false,
    showUnderline: true,
    ellipsisLine: 1,
    renderAttOnParent: true,
    containerStyle: {
      width: 'fit-content',
      fontSize: FontSize['12px']
    }
  })
})

export const TitleClassName = classNames(
  css({
    fontWeight: 600,
    fontSize: FontSize['15px'],
    userSelect: 'none',
    textTransform: 'none'
  }),
  ClassName.ellipsisFont(2)
)
export const TitleWrapperClassName = css({
  // padding: '8px 12px 0px'
})
