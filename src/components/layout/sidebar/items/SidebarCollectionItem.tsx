import { Content, Icon, Modal, AnimatePopover } from '@/components'
import CollectionForm from '@/components/form/CollectionForm'
import useCollectionStore, { collectionsAtom } from '@/stores/collection.store'
import { globalStore } from '@/stores'
import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import { AnimatePresence, motion } from 'framer-motion'
import { useAtomValue } from 'jotai'
import { selectAtom } from 'jotai/utils'
import { FC, memo, useMemo, useRef } from 'react'
import { useToggle } from '@/hooks'
import { ICollectionItem } from '~/typings/data'
import { IconNameItem } from '../SidebarCollection'
import useSidebarItemContextMenu from '../useSidebarItemContextMenu'
import useSidebarItemDrag from '../useSidebarItemDrag'
import SidebarWhiteboardItem from './SidebarWhiteboardItem'
import { ISidebarItem } from './type'
import SidebarDocumentItem from './SidebarDocumentItem'
import SidebarNoteItem from './SidebarNoteItem'
import SidebarObjectItem from './SidebarObjectItem'

const SidebarCollectionItem: FC<ISidebarItem> = memo(({ id, parentId, parentType, draggable = true }) => {
  const { updateCollection, deleteCollection } = useCollectionStore()

  const collectionAtom = useMemo(() => selectAtom(collectionsAtom, c => c.get(id)), [id])

  const collection = useAtomValue(collectionAtom, { store: globalStore })

  const items = collection?.items

  const { childrenCollections, childrenDocuments, childrenNotes, childrenWhiteboards, childrenMetas } = useMemo(() => {
    const childrenCollections = items?.filter(i => i.type === 'collection' && i.id) as Required<ICollectionItem>[]
    const childrenNotes = items?.filter(i => i.type === 'note' && i.id) as Required<ICollectionItem>[]
    const childrenDocuments = items?.filter(i => i.type === 'document' && i.id) as Required<ICollectionItem>[]
    const childrenWhiteboards = items?.filter(i => i.type === 'whiteboard' && i.id) as Required<ICollectionItem>[]
    const childrenMetas = items?.filter(i => i.type === 'meta' && i.id) as Required<ICollectionItem>[]
    return {
      childrenCollections,
      childrenNotes,
      childrenDocuments,
      childrenWhiteboards,
      childrenMetas
    }
  }, [items])

  const [hideChildren, toggleHideChildren] = useToggle(true)

  const [editModalVisible, toggleEditModalVisible] = useToggle(false)

  const ref = useRef<HTMLDivElement>(null)

  const { droppable, hovered } = draggable
    ? useSidebarItemDrag({
        id,
        type: 'collection',
        draggableElementRef: ref,
        droppableElementRef: ref,
        isInRoot: parentId === 0,
        parentId,
        parentType
      })
    : {
        droppable: false,
        hovered: false
      }

  const { contextMenuPortal } = useSidebarItemContextMenu(
    ref,
    {
      type: 'collection',
      id
    },
    {
      pinned: collection?.pinned,
      name: collection?.name,
      onPin: () => collection && updateCollection({ id: collection.id, pinned: !collection.pinned }),
      onDelete: () => collection && deleteCollection(collection.id),
      onEdit: toggleEditModalVisible,
      onAddNewSubItem: () => toggleHideChildren(false)
    }
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
        <CollectionForm
          initialObject={collection}
          onSubmit={collection => {
            updateCollection({
              id,
              ...collection
            })
            toggleEditModalVisible(false)
          }}
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
              <SidebarCollectionItem key={i.id} id={i.id} parentId={id} parentType="collection" />
            ))}
            {childrenDocuments?.map(i => (
              <SidebarDocumentItem key={i.id} id={i.id} parentId={id} parentType="collection" />
            ))}
            {childrenNotes?.map(i => (
              <SidebarNoteItem key={i.id} id={i.id} parentId={id} parentType="collection" />
            ))}
            {childrenWhiteboards.map(i => (
              <SidebarWhiteboardItem key={i.id} id={i.id} parentId={id} parentType="collection" />
            ))}
            {childrenMetas.map(i => (
              <SidebarObjectItem key={i.id} id={i.id} parentId={id} parentType="collection" />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </Content>
  )
})

export default SidebarCollectionItem
