import { AnimatePopover } from '@/components/base'
import Modal from '@/components/base/Modal'
import EditDocumentForm from '@/components/form/EditDocumentForm'
import EditNoteForm from '@/components/form/EditNoteForm'
import NewCollectionForm from '@/components/form/NewCollectionForm'
import { GlobalDragOverlayInstance, useGlobalIsDragging } from '@/components/globalDragOverlay/GlobalDragOverlay'
import Zindexes from '@/consts/zindex'
import { useMemoizedFn, useToggle } from '@/hooks'
import { GlobalScope } from '@/jotai/jotaiScope'
import useCollectionStore, { collectionsAtom, rootCollectionsAtom } from '@/stores/collection.store'
import useDocumentStore, { documentsAtom } from '@/stores/document.store'
import useNoteStore, { notesAtom } from '@/stores/note.store'
import { globalStore } from '@/stores/stores'
import ClassName from '@/styles/classNames'
import getEmoji from '@/utils/emoji'
import { css } from '@emotion/css'
import { AnimatePresence, motion } from 'framer-motion'
import { useAtomValue } from 'jotai/react'
import { atom } from 'jotai/vanilla'
import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ICollectionItem } from '~/typings/data'
import Content from '../../base/Content'
import Icon from '../../base/Icon'
import useSidebarItemContextMenu from './useSidebarItemContextMenu'
import useSidebarItemDrag, { sidebarDraggingItem, sidebarDraggingParentCollectionId } from './useSidebarItemDrag'

const SidebarCollection = () => {
  const rootCollections = useAtomValue(rootCollectionsAtom, { store: globalStore })
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
  const collection = useAtomValue(collectionAtom, { store: globalStore })

  const items = collection?.items
  const childrenCollections = items?.filter(i => i.type === 'collection' && i.id) as Required<ICollectionItem>[]
  const childrenNotes = items?.filter(i => i.type === 'note' && i.id) as Required<ICollectionItem>[]
  const childrenDocuments = items?.filter(i => i.type === 'document' && i.id) as Required<ICollectionItem>[]
  const [hideChildren, toggleHideChildren] = useToggle(true)
  const [editModalVisible, toggleEditModalVisible] = useToggle(false)
  const ref = useRef<HTMLDivElement>(null)
  const { droppable, hovered } = useSidebarItemDrag(collection, 'collection', ref, parentCollectionId)
  const { contextMenuPortal } = useSidebarItemContextMenu(
    ref,
    {
      pinned: collection?.pinned,
      name: collection?.name,
      onPin: () => collection && updateCollection({ id: collection.id, pinned: !collection.pinned }),
      onDelete: () => collection && deleteCollection(collection.id),
      onEdit: toggleEditModalVisible
    },
    collection
  )

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
      <Modal noStyle visible={editModalVisible} onClose={toggleEditModalVisible}>
        <NewCollectionForm
          isEditing
          currentCollection={collection}
          onAddCollection={toggleEditModalVisible}
          onBack={toggleEditModalVisible}
        />
      </Modal>
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
          {collection && <IconNameItem name={collection.name} color={collection.color} icon={collection.icon || 'park-folder-close'} />}
        </Content>
      </AnimatePopover>
      <AnimatePresence>
        {!hideChildren && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{
              opacity: 1,
              height: 'auto'
            }}
            exit={{ opacity: 0, height: 0 }}
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
        )}
      </AnimatePresence>
    </Content>
  )
})

export const SidebarDocumentItem = ({ documentId, parentCollectionId }: { documentId: number; parentCollectionId?: number }) => {
  const navigate = useNavigate()
  const documentAtom = useMemo(() => atom(get => get(documentsAtom).get(documentId)), [documentId])
  const document = useAtomValue(documentAtom, { store: globalStore })
  const ref = useRef<HTMLDivElement>(null)
  const [editModalVisible, toggleEditModalVisible] = useToggle(false)
  useSidebarItemDrag(document, 'document', ref, parentCollectionId)
  const { updateDocument, deleteDocument } = useDocumentStore()
  const { contextMenuPortal } = useSidebarItemContextMenu(ref, {
    pinned: document?.pinned,
    name: document?.name,
    onEdit: toggleEditModalVisible,
    onPin: () => updateDocument({ id: document?.id, pinned: !document?.pinned }),
    onDelete: () => deleteDocument(document?.id)
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
      <Modal visible={editModalVisible} onClose={toggleEditModalVisible}>
        <EditDocumentForm
          onBack={toggleEditModalVisible}
          initialObject={document}
          onSubmit={obj => {
            console.log(obj)
            updateDocument(obj)
            toggleEditModalVisible()
          }}
        />
      </Modal>
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
  const note = useAtomValue(noteAtom, { store: globalStore })
  const [editModalVisible, toggleEditModalVisible] = useToggle(false)
  useSidebarItemDrag(note, 'note', ref, parentCollectionId)
  const { updateNote, deleteNote } = useNoteStore()
  const { contextMenuPortal } = useSidebarItemContextMenu(ref, {
    pinned: note?.pinned,
    name: note?.title,
    onEdit: toggleEditModalVisible,
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
      <Modal visible={editModalVisible} onClose={toggleEditModalVisible} noStyle>
        <EditNoteForm
          onBack={toggleEditModalVisible}
          initialObject={note}
          onSubmit={n => {
            n.id && updateNote(n)
            toggleEditModalVisible()
          }}
        />
      </Modal>
      {contextMenuPortal}
      <IconNameItem icon={note.icon || 'park-notes'} name={note.title} color={note.color} />
    </Content>
  )
}

const IconNameItem = memo(({ name, icon, color }: { name?: string; icon?: string; color?: string }) => {
  const isPark = icon?.startsWith('park')
  const [emoji, setEmoji] = useState<any>()
  const linearFontColor = color?.startsWith('linear')
  const linearColors = color && linearFontColor && linearToSvg(color)
  useEffect(() => {
    if (!isPark) {
      icon && getEmoji(icon).then(data => setEmoji(data))
    }
  }, [isPark, icon])
  return (
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
        <>{icon && <Icon fill={linearColors ? linearColors[(linearColors.length / 2) | 0] : color} name={icon} />}</>
      )}
      <div
        style={{
          color: color,
          backgroundImage: linearFontColor ? color : undefined
        }}
        className={css([
          ClassName.ellipsisFont(1),
          linearFontColor && {
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }
        ])}
      >
        {name}
      </div>
    </Content>
  )
})

export default SidebarCollection
