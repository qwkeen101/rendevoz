import { AnimatePopover } from '@/components/base'
import Modal from '@/components/base/Modal'
import NewCollectionForm from '@/components/form/NewCollectionForm'
import { GlobalDragOverlayInstance, useGlobalIsDragging } from '@/components/GlobalDragOverlay'
import Zindexes from '@/consts/zindex'
import { useMemoizedFn, useToggle } from '@/hooks'
import { GlobalScope } from '@/jotai/jotaiScope'
import useCollectionStore, { collectionsAtom } from '@/stores/collection.store'
import useDocumentStore, { documentsAtom } from '@/stores/document.store'
import useNoteStore, { notesAtom } from '@/stores/note.store'
import ClassName from '@/styles/classNames'
import getEmoji from '@/utils/emoji'
import { css } from '@emotion/css'
import { motion } from 'framer-motion'
import { atom, useAtomValue } from 'jotai'
import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ICollectionItem } from '~/typings/data'
import Content from '../../base/Content'
import Icon from '../../base/Icon'
import useSidebarItemContextMenu from './useSidebarItemContextMenu'
import useSidebarItemDrag, { sidebarDraggingItem, sidebarDraggingParentCollectionId } from './useSidebarItemDrag'

const SidebarCollection = () => {
  const { rootCollections } = useCollectionStore()
  const [newCollectionVisible, setNewCollectionVisible] = useState(false)
  const [globalIsDragging] = useGlobalIsDragging()
  const containerRef = useRef<HTMLDivElement>(null)
  const [dropVisible, toggleDropVisible] = useState(false)
  const { moveItemBetweenCollections } = useCollectionStore()
  const pointerHandler = useMemoizedFn((e: PointerEvent) => {
    if (e.type === 'pointerleave') {
      toggleDropVisible(false)
    }
    if (e.type === 'pointerup') {
      toggleDropVisible(false)
    }
    const draggingEle = GlobalDragOverlayInstance.draggingDetails
    if (draggingEle) {
      if (draggingEle.type === 'collection') {
        if (e.type === 'pointerenter') {
          toggleDropVisible(true)
        }
        if (e.type === 'pointerup') {
          if (sidebarDraggingItem && sidebarDraggingParentCollectionId) {
            moveItemBetweenCollections(
              {
                id: sidebarDraggingItem.id,
                type: 'collection'
              },
              sidebarDraggingParentCollectionId,
              1
            )
          }
        }
      }
    }
  })
  useEffect(() => {
    if (globalIsDragging) {
      containerRef.current?.addEventListener('pointerenter', pointerHandler)
      containerRef.current?.addEventListener('pointerleave', pointerHandler)
      containerRef.current?.addEventListener('pointerup', pointerHandler)
      return () => {
        containerRef.current?.removeEventListener('pointerenter', pointerHandler)
        containerRef.current?.removeEventListener('pointerleave', pointerHandler)
        containerRef.current?.removeEventListener('pointerup', pointerHandler)
      }
    }
  }, [globalIsDragging])
  return (
    <>
      <Modal noStyle visible={newCollectionVisible} onClose={() => setNewCollectionVisible(false)}>
        <NewCollectionForm onAddCollection={() => setNewCollectionVisible(false)} onBack={() => setNewCollectionVisible(false)} />
      </Modal>
      <AnimatePopover
        visible={dropVisible}
        positions={['top']}
        padding={10}
        containerStyle={{ zIndex: String(Zindexes.PopupMenu) }}
        content={
          <div style={{ color: 'white', background: 'rgba(0,0,0,0.8)', padding: '2px 4px', borderRadius: 4, fontSize: 12 }}>
            Drop to move collection to outside
          </div>
        }
        innerRef={containerRef}
      >
        <Content
          flex
          alignItems="center"
          justifyContent="space-between"
          className={css([ClassName.description(), dropVisible && ClassName.Drag.droppableItemHovered(true)])}
          style={{ padding: '0px 4px', transition: 'all 0.3s ease' }}
        >
          <div>Collections</div>
          <Icon
            name="park-plus"
            size={14}
            onClick={() => {
              setNewCollectionVisible(true)
            }}
            className={ClassName.circleButton(2, 4)}
          />
        </Content>
      </AnimatePopover>
      <Content flex column style={{ overflowY: 'auto', padding: '0px 2px' }}>
        {rootCollections.map(i => (
          <SidebarCollectionItem key={i.id} collectionId={i.id} parentCollectionId={1} />
        ))}
      </Content>
    </>
  )
}
const linearToSvg = (linear: string) => {
  return linear.match(/rgba\([^()]*\)|#\w+/g)
}
export const SidebarCollectionItem = memo(({ collectionId, parentCollectionId }: { collectionId: number; parentCollectionId?: number }) => {
  const { updateCollection, deleteCollection } = useCollectionStore()
  const collectionAtom = useMemo(() => atom(get => get(collectionsAtom).get(collectionId)), [collectionId])
  const collection = useAtomValue(collectionAtom, GlobalScope)
  const [emoji, setEmoji] = useState<any>()
  const items = collection?.items
  const childrenCollections = items?.filter(i => i.type === 'collection' && i.id) as Required<ICollectionItem>[]
  const childrenNotes = items?.filter(i => i.type === 'note' && i.id) as Required<ICollectionItem>[]
  const childrenDocuments = items?.filter(i => i.type === 'document' && i.id) as Required<ICollectionItem>[]
  const [hideChildren, toggleHideChildren] = useToggle(true)
  const ref = useRef<HTMLDivElement>(null)
  const { droppable, hovered } = useSidebarItemDrag(collection, 'collection', ref.current, parentCollectionId)
  const { contextMenuPortal } = useSidebarItemContextMenu(
    ref.current,
    {
      pinned: collection?.pinned,
      name: collection?.name,
      onPin: () => collection && updateCollection({ id: collection.id, pinned: !collection.pinned }),
      onDelete: () => collection && deleteCollection(collection.id)
    },
    collection
  )
  useEffect(() => {
    collection?.icon && getEmoji(collection.icon).then(data => setEmoji(data))
  }, [collection?.icon])

  const linearFontColor = collection?.color?.startsWith('linear')
  const linearId = collection?.color
  const linearColors = linearFontColor && linearId && linearToSvg(linearId)
  if (!collection || collection.deleted) return null
  return (
    <Content
      flex
      column
      className={css({
        color: '#5f6065',
        userSelect: 'none'
      })}
    >
      {contextMenuPortal}
      <AnimatePopover
        visible={hovered}
        padding={10}
        content={
          <div
            style={{
              fontSize: 12,
              background: 'rgba(0,0,0,0.8)',
              color: 'white',
              borderRadius: 4,
              padding: '2px 4px'
            }}
          >
            {!droppable && "Can't"} Move into {collection.name}
          </div>
        }
        positions={['top']}
        containerStyle={{ zIndex: '10000', pointerEvents: 'none' }}
        innerRef={ref}
      >
        <Content
          flex
          onClick={toggleHideChildren}
          alignItems="center"
          className={css([
            {
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              borderRadius: 4,
              padding: 2,
              margin: 2,
              paddingLeft: 14,
              ':hover': {
                background: 'rgba(0,0,0,0.07)'
              }
            },
            hovered && ClassName.Drag.droppableItemHovered(droppable)
          ])}
        >
          <Icon
            className={css({
              transform: !hideChildren ? 'rotate(90deg)' : undefined,
              transition: 'all 0.2s ease',
              transformOrigin: 'center',
              position: 'absolute',
              left: -14
            })}
            size={12}
            theme="filled"
            name="park-right-one"
          />
          <Content flex alignItems="center" gap={10} style={{ overflow: 'hidden' }}>
            {emoji ? (
              <img
                src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=="
                style={{
                  width: '1em',
                  height: '1em',
                  backgroundImage: `url(${emoji?.imageSrc})`,
                  backgroundPositionX: `${(emoji?.x * 100) / 60}%`,
                  backgroundPositionY: `${(emoji?.y * 100) / 60}%`,
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '6100% 6100%',
                  verticalAlign: '-0.1em',
                  marginRight: 2
                }}
              />
            ) : (
              <>
                <Icon fill={linearColors ? linearColors[(linearColors.length / 2) | 0] : collection.color} name="park-folder-close" />
              </>
            )}
            <div
              style={{
                color: collection.color,
                backgroundImage: linearFontColor ? collection.color : undefined
              }}
              className={css([
                ClassName.ellipsisFont(1),
                linearFontColor && {
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }
              ])}
            >
              {collection.name}
            </div>
          </Content>
        </Content>
      </AnimatePopover>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{
          opacity: hideChildren ? 0 : 1,
          height: hideChildren ? 0 : 'auto'
        }}
        className={css({
          paddingLeft: 15,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        })}
      >
        {childrenCollections?.map(i => (
          <SidebarCollectionItem key={i.id} collectionId={i.id} parentCollectionId={collection.id} />
        ))}
        {childrenDocuments?.map(i => (
          <SidebarDocumentItem key={i.id} documentId={i.id} parentCollectionId={collection.id} />
        ))}
        {childrenNotes?.map(i => (
          <SidebarNoteItem key={i.id} noteId={i.id} parentCollectionId={collection.id} />
        ))}
      </motion.div>
    </Content>
  )
})

export const SidebarDocumentItem = ({ documentId, parentCollectionId }: { documentId: number; parentCollectionId?: number }) => {
  const navigate = useNavigate()
  const documentAtom = useMemo(() => atom(get => get(documentsAtom).get(documentId)), [documentId])
  const document = useAtomValue(documentAtom, GlobalScope) || {}
  const ref = useRef<HTMLDivElement>(null)

  useSidebarItemDrag(document, 'document', ref.current, parentCollectionId)
  const { updateDocument, deleteDocumentById } = useDocumentStore()
  const { contextMenuPortal } = useSidebarItemContextMenu(ref.current, {
    pinned: document.pinned,
    name: document.name,
    onRename: name => updateDocument({ id: document.id, name }),
    onPin: () => updateDocument({ id: document.id, pinned: !document.pinned }),
    onDelete: () => deleteDocumentById(document.id)
  })
  if (!document || document.deleted) return null
  return (
    <Content
      flex
      gap={10}
      ref={ref}
      onClick={() => navigate(`/pdf/${document.id}`)}
      className={css({
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        borderRadius: 4,
        padding: '2px 8px',
        ':hover': {
          background: 'rgba(0,0,0,0.07)'
        }
      })}
    >
      {contextMenuPortal}
      <Icon name="park-file-pdf" />
      <div
        className={css({
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        })}
      >
        {document.name}
      </div>
    </Content>
  )
}

export const SidebarNoteItem = ({ noteId, parentCollectionId }: { noteId: number; parentCollectionId?: number }) => {
  const navigate = useNavigate()
  const ref = useRef<HTMLDivElement>(null)
  const noteAtom = useMemo(() => atom(get => get(notesAtom).get(noteId)), [noteId])
  const note = useAtomValue(noteAtom, GlobalScope)
  useSidebarItemDrag(note, 'note', ref.current, parentCollectionId)
  const { updateNote, deleteNote } = useNoteStore()
  const { contextMenuPortal } = useSidebarItemContextMenu(ref.current, {
    pinned: note?.pinned,
    name: note?.title,
    onRename: name => {
      note &&
        updateNote({
          id: note.id,
          title: name
        })
    },
    onPin: () => {
      note &&
        updateNote({
          id: note.id,
          pinned: !note.pinned
        })
    },
    onDelete: () => note && deleteNote(note.id)
  })
  if (!note || note.deleted) return null
  return (
    <Content
      flex
      gap={10}
      ref={ref}
      onClick={() => navigate(`/editor/${note.id}`)}
      className={css({
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        borderRadius: 4,
        padding: '2px 8px',
        ':hover': {
          background: 'rgba(0,0,0,0.07)'
        }
      })}
    >
      {contextMenuPortal}
      <Icon name="park-notes" />
      <div
        className={css({
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        })}
      >
        {note.title}
      </div>
    </Content>
  )
}
export default SidebarCollection
