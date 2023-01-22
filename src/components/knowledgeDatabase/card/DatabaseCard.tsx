import { FC, useRef, useState } from 'react'
import { MetaDocumentObject, MetaKnowledgeObject, MetaNoteObject, MetaObject } from '~/typings/data'
import { AnimatePresence, motion } from 'framer-motion'
import { css } from '@emotion/css'
import { useTheme } from '@/hooks'
import MetaKnowledgeCard from './KnowledgeCard'
import classNames from 'classnames'
import ClassName from '@/styles/classNames'
import { AnimatePopover, Content, Icon, Image, WithBorder } from '@/components'
import DateFormat from '@/utils/dateFormat'
import { useAtom } from 'jotai'
import useMetaStore, { relatedMetaObjectsMapAtom } from '@/stores/meta.store'
import { GlobalScope } from '@/jotai/jotaiScope'
import { GlobalGraphInstance } from '@/components/graph/GlobalGraph'
import Modal from '@/components/base/Modal'
import useCardDrag from './useCardDrag'
import EditMetaObjectForm from '@/components/form/EditMetaObjectForm'
import { AvaliableGlobalDraggingElements, GlobalDragOverlayInstance } from '@/components/GlobalDragOverlay'
import MetaNoteCard from './NoteCard'
import MetaDocumentCard from './DocumentCard'

const isKnowledge = (m: MetaObject): m is MetaKnowledgeObject => m.type === 'knowledge'
const isDoc = (m: MetaObject): m is MetaDocumentObject => m.type === 'document'
const isNote = (m: MetaObject): m is MetaNoteObject => m.type === 'note'
type DisplayTypes = Pick<AvaliableGlobalDraggingElements, 'type'>['type']
export const typeToTypeRecord: Record<DisplayTypes, string> = {
  pdfElement: 'Pdf label',
  noteElement: 'Note block',
  note: 'Note',
  pdf: 'Pdf',
  image: 'Image',
  metaElement: 'Meta Object',
  normal: 'Object'
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
  const [related] = useAtom(relatedMetaObjectsMapAtom, GlobalScope)
  const set = related.get(metaObject.id)
  set?.delete(metaObject.id)
  const relatedNumber = set?.size
  const [showIcon, setShowIcon] = useState(false)
  const [showPopover, setShowPopover] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const cover = metaObject.coverImgSrc
  const [innerCover, setInnerCover] = useState(cover)
  const showImage = !!cover || !!innerCover
  const { updateMetaObject, deleteMetaObject } = useMetaStore()

  const { isCardDraggingInside } = useCardDrag(
    metaObject,
    containerRef.current?.getElementsByClassName(TitleClassName).item(0),
    containerRef.current
  )
  const renderCardContent = () => {
    // if (isKnowledge(metaObject)) {
    switch (metaObject.type) {
      case 'note':
        return <MetaNoteCard m={metaObject} />
      case 'pdf':
        return <MetaDocumentCard onCoverChange={url => setInnerCover(url)} m={metaObject} />
      default:
        return <MetaKnowledgeCard m={metaObject} />
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
          onClickOutside={() => setShowPopover(false)}
          positions={['bottom']}
          align="start"
          padding={10}
          content={<WithBorder>{renderPopover()}</WithBorder>}
          disableIntersection
          containerStyle={{ zIndex: '9999' }}
        >
          <Icon
            onClick={() => setShowPopover(!showPopover)}
            size={18}
            name="park-more"
            className={ClassName.circleButton(3)}
            style={{
              opacity: showIcon || showPopover ? 1 : 0
            }}
          />
        </AnimatePopover>
      </Content>
    )
  }

  const renderPopover = () => (
    <Content
      flex
      column
      style={{ padding: 6, fontWeight: 500, width: 180 }}
      onClick={e => {
        if (e.target !== e.currentTarget) {
          setShowPopover(false)
        }
      }}
    >
      <div className={ClassName.flatButton()} onClick={() => setShowEdit(true)}>
        Edit
      </div>
      <div className={ClassName.flatButton()} onClick={() => updateMetaObject({ id: metaObject.id, pinned: !metaObject.pinned })}>
        {metaObject.pinned ? 'Unpin' : 'Pin'}
      </div>
      <div className={ClassName.flatButton()} onClick={() => GlobalGraphInstance?.open(metaObject)}>
        Graph
      </div>
      <div
        onClick={() => deleteMetaObject(metaObject.id)}
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
        Delete
      </div>
    </Content>
  )

  const renderEdit = () => (
    <Modal visible={showEdit} onClose={() => setShowEdit(false)} width={320}>
      <EditMetaObjectForm
        title="Edit"
        metaObject={structuredClone(metaObject)}
        onUpdate={newMeta => {
          setShowEdit(false)
          updateMetaObject(newMeta)
        }}
      />
    </Modal>
  )
  const variants = {
    hidden: {
      opacity: 0,
      x: -30
    },
    show: {
      opacity: 1,
      x: 0,
      transition: {
        delay: index ? index / 10 : 0
      }
    }
  }
  return (
    <>
      {renderEdit()}
      <motion.div
        initial="hidden"
        animate="show"
        exit="hidden"
        variants={variants}
        ref={containerRef}
        // transition={{ delay: index/10 }}
        onHoverStart={() => setShowIcon(true)}
        onHoverEnd={() => setShowIcon(false)}
        className={css({
          minHeight: 150,
          cursor: 'pointer',
          borderRadius: 16,
          background: 'white',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.3s cubic-bezier(0.2, 0.91, 0.85, 0.96) 0s, background-color 0.3s ease 0s',
          boxShadow: 'rgba(100, 100, 111, 0.2) 0px 7px 29px 0px',
          ':hover': {
            boxShadow: 'rgba(100, 100, 111, 0.35) 0px 7px 29px 0px'
          }
        })}
      >
        <AnimatePresence>
          {isCardDraggingInside && (
            <motion.div
              initial={{ backdropFilter: 'blur(0px)', opacity: 0 }}
              animate={{ backdropFilter: 'blur(4px)', opacity: 1 }}
              exit={{ backdropFilter: 'blur(0px)', opacity: 0 }}
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
              {GlobalDragOverlayInstance.draggingDetails?.type === 'image' ? 'Drop to change cover' : 'Drop to add Link'}
            </motion.div>
          )}
        </AnimatePresence>
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
        <div className={css({ background: 'white', padding: '16px', borderRadius: 16, marginTop: showImage ? -16 : 0, zIndex: 1 })}>
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
            <span>{typeToTypeRecord[metaObject.type] || 'OBJECT'}</span>
            <span style={{ display: 'flex', gap: 5, fontSize: 10, alignItems: 'center', lineHeight: 1 }}>
              <Icon size={13} name="park-time" />
              {DateFormat.formatDistanceToNowStrict(metaObject.createdAt)} Ago
            </span>
          </div>
          {renderCardContent()}
        </div>
        <div className={css({ background: 'white', padding: '0 16px 8px', marginTop: 'auto' })}>{renderToolbar()}</div>
      </motion.div>
    </>
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
export default DatabaseCard
