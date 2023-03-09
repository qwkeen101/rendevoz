import { FC, memo, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { css } from '@emotion/css'
import { useTheme } from '@/hooks'
import MetaKnowledgeCard from './KnowledgeCard'
import classNames from 'classnames'
import ClassName from '@/styles/classNames'
import { AnimatePopover, Content, Icon, Image, Tooltip, WithBorder } from '@/components'
import DateFormat from '@/utils/dateFormat'
import { metaObjectsAtom, relatedMetaObjectsMapAtom } from '@/stores/meta.store'
import { GlobalGraphInstance } from '@/components/graph/GlobalGraph'
import Modal from '@/components/base/Modal'
import useCardDrag from './useCardDrag'
import { Tag } from '@/components/form/EditMetaObjectForm'
import { GlobalDragOverlayInstance } from '@/components/globalDragOverlay/GlobalDragOverlay'
import MetaNoteCard from './NoteCard'
import MetaDocumentCard from './DocumentCard'
import { Flipped, spring } from 'react-flip-toolkit'
import { MetaStore } from '@/stores'
import { MetaObject } from '~/typings/data'
import { MetaDatabaseCardProps } from './types'
import MetaObjectCard from './ObjectCard'
import { selectAtom } from 'jotai/utils'
import { useGlobalAtomValue } from '@/jotai/jotaiScope'
import ObjectForm from '@/components/form/ObjectForm'
import { PartialWithId } from '@/types'
import { useTranslation } from 'react-i18next'

export const TypeToTypeName: Record<MetaObject['type'], string> = {
  pdfElement: 'pdf label',
  noteElement: 'note block',
  note: 'note',
  pdf: 'pdf',
  image: 'image',
  normal: 'object',
  whiteboard: 'whiteboard',
  video: 'video',
  audio: 'audio'
}
const DatabaseCard: FC<{
  index?: number
  metaObject: MetaObject
}> = ({ index, metaObject }) => {
  const { defaultFontColorBlack, defaultFontColorGrey, defaultFontColorRed } = useTheme(
    'defaultFontColorBlack',
    'defaultFontColorGrey',
    'defaultFontColorRed'
  )
  const relatedAtom = useMemo(() => selectAtom(relatedMetaObjectsMapAtom, r => r.get(metaObject.id)), [metaObject.id])
  const set = useGlobalAtomValue(relatedAtom)
  set?.delete(metaObject.id)
  const relatedNumber = set?.size
  const [showIcon, setShowIcon] = useState(false)
  const [showPopover, setShowPopover] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const cover = metaObject.coverImgSrc
  const [innerCover, setInnerCover] = useState(cover)
  const showImage = !!cover || !!innerCover
  const { updateMetaObject, deleteMetaObject } = MetaStore
  const iconRef = useRef<HTMLDivElement>(null)
  const { isCardDraggingInside } = useCardDrag(metaObject, iconRef, containerRef.current)
  
  const { t } = useTranslation()

  const renderCardContent = () => {
    switch (metaObject.type) {
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
          color: defaultFontColorGrey,
          fontSize: 12
        })}
      >
        <Content flex gap={6} alignItems="baseline">
          <span className={css({ fontSize: 24, fontWeight: 650, color: defaultFontColorBlack })}>{relatedNumber || 0}</span>
          <span className={css({ fontSize: 11, fontWeight: 500, color: defaultFontColorGrey })}>Related Objects</span>
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

  const renderPopover = () => (
    <ObjectActionPopover metaObjectId={metaObject.id} onClose={() => setShowPopover(false)} onEdit={() => setShowEdit(true)} />
  )

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
          <div className={css([ClassName.description(), ClassName.ellipsisFont(6)])}>{description}</div>
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
  return (
    <Flipped onAppear={onElementAppear} onExit={onExit} flipId={metaObject.id} key={metaObject.id}>
      <div
        ref={containerRef}
        onPointerEnter={() => setShowIcon(true)}
        onPointerLeave={() => setShowIcon(false)}
        style={{ gridRowEnd: showImage ? 'span 2' : undefined }}
        className={css({
          minHeight: 150,
          cursor: 'pointer',
          borderRadius: 16,
          background: 'white',
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
            color: defaultFontColorBlack,
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
              height: 150,
              // flexBasis: 150,
              overflow: 'hidden'
            })}
            src={innerCover || cover}
          />
        )}
        <div
          className={css({
            background: 'white',
            padding: '16px',
            borderRadius: 16,
            marginTop: showImage ? -16 : 0,
            zIndex: 1
          })}
        >
          <div
            style={{
              fontWeight: 600,
              fontSize: 11,
              marginBottom: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#8590ae',
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
                <Tag small hideSize hideDelete tag={i} key={i} />
              ))}
            </Content>
          )}
          <div style={{ minHeight: 80 }}>{renderCardContent()}</div>
        </div>
        <div className={css({ background: 'white', padding: '0 16px 8px', marginTop: 'auto' })}>{renderToolbar()}</div>
      </div>
    </Flipped>
  )
}

export const ObjectActionPopover: FC<
  Partial<{
    onClose: VoidFunction
    onEdit: VoidFunction
    onPin: VoidFunction
    onGraph: VoidFunction
    onDelete: VoidFunction
  }> & { metaObjectId: number }
> = ({ onClose, onEdit, onPin, onGraph, onDelete, metaObjectId }) => {
  const { defaultFontColorRed } = useTheme('defaultFontColorRed')
  const { updateMetaObject, deleteMetaObject } = MetaStore
  const { t } = useTranslation()
  const metaObjectAtom = useMemo(() => selectAtom(metaObjectsAtom, m => m.get(metaObjectId)), [metaObjectId])
  const metaObject = useGlobalAtomValue(metaObjectAtom)
  if (!metaObject) return null
  return (
    <Content
      flex
      column
      style={{ padding: 6, fontWeight: 500, width: 180 }}
      className={css({
        ' > div': {
          textTransform: 'capitalize'
        }
      })}
    >
      <div
        className={ClassName.flatButton()}
        onClick={() => {
          onClose?.()
          onEdit?.()
        }}
      >
        {t('general.edit')}
      </div>
      <div
        className={ClassName.flatButton()}
        onClick={() => {
          updateMetaObject({ id: metaObject.id, pinned: !metaObject.pinned })
          onPin?.()
          onClose?.()
        }}
      >
        {metaObject.pinned ? t('general.unpin') : t('general.pin')}
      </div>
      <div
        className={ClassName.flatButton()}
        onClick={() => {
          GlobalGraphInstance?.open(metaObject)
          onGraph?.()
          onClose?.()
        }}
      >
        {t('general.graph')}
      </div>
      <div
        onClick={() => {
          deleteMetaObject(metaObject.id)
          onDelete?.()
        }}
        className={classNames(
          ClassName.flatButton(),
          css({
            color: defaultFontColorRed,
            ':hover': {
              background: 'rgba(237,49,61,0.09)'
            }
          })
        )}
      >
        {t('general.delete')}
      </div>
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
export default memo(DatabaseCard)
