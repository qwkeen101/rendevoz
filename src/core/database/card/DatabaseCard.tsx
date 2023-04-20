import { FC, memo, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { css } from '@emotion/css'
import { useTheme, useToggle } from '@/hooks'
import MetaKnowledgeCard from './KnowledgeCard'
import classNames from 'classnames'
import ClassName from '@/styles/classNames'
import { AnimatePopover, Button, Content, Icon, Image, Tooltip, WithBorder } from '@/components'
import DateFormat from '@/utils/dateFormat'
import { indexedMetaLinksAtom, metaObjectsAtom, relatedMetaObjectsMapAtom } from '@/stores/meta.store'
import Modal from '@/components/base/Modal'
import useCardDrag from './useCardDrag'
import { GlobalDragOverlayInstance, GlobalGraphInstance, ObjectTag, useRenderObject } from '@/core'
import MetaNoteCard from './NoteCard'
import MetaDocumentCard from './DocumentCard'
import { Flipped, spring } from 'react-flip-toolkit'
import { MetaStore, globalStore } from '@/stores'
import { MetaObject } from '~/typings/data'
import { MetaDatabaseCardProps } from './types'
import MetaObjectCard from './ObjectCard'
import { selectAtom } from 'jotai/utils'
import { useGlobalAtomValue } from '@/hooks/jotai'
import ObjectForm from '@/components/form/ObjectForm'
import { PartialWithId } from '@/types'
import { useTranslation } from 'react-i18next'
import { GlobalEventEmitter } from '@/events'
import Colors from '@/consts/colors'
import { metaLinksAtom } from '@/stores/meta.store'
import { Zindexes } from '@/consts'

export const TypeToTypeName: Record<MetaObject['type'], string> = {
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
  webpageLabel: 'webpage label'
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
          fontSize: 12
        })}
      >
        <Content flex gap={6} alignItems="baseline">
          <span className={css({ fontSize: 24, fontWeight: 650 })}>{relatedNumber || 0}</span>
          <span className={css({ fontSize: 11, fontWeight: 500 })}>Related Objects</span>
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
              <Content flex column alignItems="center" style={{ textTransform: 'capitalize', fontSize: 12, fontFamily: 'Muli' }}>
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
          <div className={TitleClassName} onClick={onTitleClick}>
            {title}
          </div>
          <div style={{ whiteSpace: 'pre-line' }} className={css([ClassName.description(), ClassName.ellipsisFont(6)])}>
            {description}
          </div>
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
          minHeight: 150,
          cursor: 'pointer',
          borderRadius: 16,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          transition: 'box-shadow 0.3s cubic-bezier(0.2, 0.91, 0.85, 0.96) 0s, background-color 0.3s ease 0s',
          boxShadow: 'rgba(100, 100, 111, 0.2) 0px 7px 29px 0px',
          willChange: 'transform',
          ':hover': {
            boxShadow: 'rgba(100, 100, 111, 0.35) 0px 7px 29px 0px'
          }
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
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            fontWeight: 600
          })}
        >
          <div style={{ opacity: isCardDraggingInside ? 1 : 0, transition: 'opacity 0.3s ease' }}>
            {GlobalDragOverlayInstance.draggingDetails?.type === 'image' ? 'Drop to change cover' : 'Drop to add Link'}
          </div>
        </motion.div>

        {showImage && (
          <Image
            className={css({
              width: '100% !important',
              height: '70%',
              maxHeight: '300px',
              overflow: 'hidden'
            })}
            src={innerCover || cover}
          />
        )}
        <div
          className={css({
            position: 'relative',
            padding: '16px',
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            background: Colors.Background.Linear,
            marginTop: showImage ? -32 : 0,
            zIndex: 1
          })}
        >
          {showImage && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                zIndex: -1,
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                height: '60%',
                backdropFilter: 'blur(4px)'
              }}
            ></div>
          )}
          <div
            style={{
              fontWeight: 600,
              fontSize: 11,
              marginBottom: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              textTransform: 'uppercase'
            }}
          >
            <span>{t(`general.${TypeToTypeName[metaObject.type] || 'object'}`)}</span>
            <span style={{ display: 'flex', gap: 5, fontSize: 10, alignItems: 'center', lineHeight: 1 }}>
              <Icon size={13} name="park-time" />
              {DateFormat.formatDistanceToNowStrict(metaObject.createdAt)} Ago
            </span>
          </div>
          {metaObject.tags && metaObject.tags.length > 0 && (
            <Content flex gap={4} style={{ flexWrap: 'wrap', marginBottom: 4 }}>
              {metaObject.tags?.map(i => (
                <ObjectTag small hideSize hideDelete tag={i} key={i} />
              ))}
            </Content>
          )}
          <div style={{ minHeight: 80 }}>{renderCardContent()}</div>
        </div>
        <div
          className={css({
            padding: '0 16px 8px',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            background: Colors.Background.Linear
          })}
        >
          {renderToolbar()}
        </div>
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
    visibility: {
      jumpToVisible?: boolean
    }
  }> & { metaObjectId: number }
> = ({ onClose, onEdit, onPin, onGraph, onDelete, metaObjectId, visibility, onJump }) => {
  const { updateMetaObject, deleteMetaObject } = MetaStore
  const { t } = useTranslation()
  const [relatedVisible, toggleRelatedVisible] = useToggle(false)
  const metaObject = MetaStore.useValue(metaObjectId)
  if (!metaObject) return null
  return (
    <Content flex column style={{ padding: 6, fontWeight: 500, width: 180 }}>
      {visibility?.jumpToVisible && <Button.IconButton onClick={onJump} text="Focus" icon="park-share-two" />}
      <Button.IconButton
        text={t('general.edit')}
        icon="park-edit"
        onClick={() => {
          onClose?.()
          GlobalEventEmitter().emit('global', {
            type: 'globalNeedEditMetaObject',
            data: {
              metaObjectId
            }
          })
          onEdit?.()
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
        text={t('general.graph')}
        icon="park-share-one"
        onClick={() => {
          GlobalGraphInstance?.open?.(metaObject)
          onGraph?.()
          onClose?.()
        }}
      />
      <AnimatePopover
        positions={['right', 'left']}
        visible={relatedVisible}
        onClickOutside={toggleRelatedVisible}
        boundaryInset={20}
        padding={10}
        containerStyle={{
          zIndex: String(Zindexes.Tooltip)
        }}
        content={
          <WithBorder
            padding={8}
            style={{
              minWidth: 200,
              maxWidth: 400
            }}
          >
            <RelatedPanel metaId={metaObjectId} />
          </WithBorder>
        }
      >
        <Button.IconButton
          text={t('general.related')}
          icon="park-link-one"
          onClick={e => {
            toggleRelatedVisible()
            e.preventDefault()
            e.stopPropagation()
          }}
        ></Button.IconButton>
      </AnimatePopover>
      <Button.IconButton
        text={t('general.delete')}
        dangerous
        onClick={() => {
          deleteMetaObject(metaObject.id, false, true )
          onDelete?.()
        }}
        icon="park-delete"
      />
    </Content>
  )
}

const RelatedPanel = memo(({ metaId }: { metaId: number }) => {
  const sourceToTarget = useGlobalAtomValue(indexedMetaLinksAtom)?.sourceIdToLinkIdsMap.get(metaId)
  const targetToSource = useGlobalAtomValue(indexedMetaLinksAtom)?.targetIdToLinkIdMap.get(metaId)
  const linkStore = globalStore.get(metaLinksAtom)
  return (
    <Content
      flex
      column
      className={css({
        maxHeight: '70vh',
        overflowY: 'auto',
        '> div': {
          ':not(:last-child)': {
            borderBottom: `1px solid ${Colors.Background.Border}`
          }
        }
      })}
    >
      {Array.from(targetToSource?.values() || []).map(i => {
        const link = linkStore.get(i)
        if (link) {
          return <RelatedItem direction="targetToSource" metaId={link.sourceId} />
        }
      })}
      {Array.from(sourceToTarget?.values() || []).map(i => {
        const link = linkStore.get(i)
        if (link) {
          return <RelatedItem direction="sourceToTarget" metaId={link?.targetId} />
        }
      })}
    </Content>
  )
})

const RelatedItem = ({ metaId, direction }: { metaId: number; direction: 'sourceToTarget' | 'targetToSource' }) => {
  const { renderTags, renderTitle } = useRenderObject({ metaObjectId: metaId })

  return (
    <Content
      flex
      gap={16}
      style={{
        padding: '6px 0px 2px'
      }}
    >
      <Icon name={direction === 'targetToSource' ? 'park-new-afferent' : 'park-new-efferent'} />
      <Content flex column>
        {renderTags({})}
        {renderTitle({
          style: {
            fontSize: 14
          },
          ellipsisLine: 1
        })}
      </Content>
    </Content>
  )
}
export const TitleClassName = classNames(
  css({
    fontWeight: 700,
    fontSize: 20,
    lineHeight: '24px',
    userSelect: 'none'
  }),
  ClassName.ellipsisFont(2)
)
export const TitleWrapperClassName = css({
  // padding: '8px 12px 0px'
})
