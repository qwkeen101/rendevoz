import { AnimatePopover, Content, Icon, Modal } from '@/components'
import CollectionForm from '@/components/form/CollectionForm'
import useCollectionStore, { collectionsAtom } from '@/api/stores/collection.store'
import { CollectionStore, globalStore, MetaStore } from '@/api/stores'
import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import { AnimatePresence } from 'framer-motion'
import { FC, memo, useMemo, useRef } from 'react'
import { useGlobalAtomValue, useSelectGlobalAtomValue, useToggle } from '@/hooks'
import { ICollectionItem } from '~/typings/data'
import { IconNameItem } from '../SidebarCollection'
import useSidebarItemContextMenu from '../useSidebarItemContextMenu'
import useSidebarItemDrag, { sidebarDraggingState } from '../useSidebarItemDrag'
import { ISidebarItem } from './type'
import SidebarObjectItem from './SidebarObjectItem'
import { metaObjectsAtom } from '@/api/stores/meta/meta.store'
import FontSize from '@/consts/font'
import { Rendevoz } from '@/core/rendevoz'
import { DraggableElement } from '@/core'

const SidebarCollectionItem: FC<ISidebarItem> = memo(
  ({ id, parentId, parentType, draggable = true, onClick, onlyCollection, selectMode }) => {
    const { updateCollection, deleteCollection } = CollectionStore

    const collection = useSelectGlobalAtomValue(collectionsAtom, c => c.get(id))

    const items = collection?.items

    const { childrenCollections, childrenMetas } = useMemo(() => {
      console.log(items)
      if (!items) {
        return {
          childrenMetas: [],
          childrenCollections: []
        }
      }
      const childrenCollections = items?.filter(i => i.type === 'collection' && i.id) as Required<ICollectionItem>[]
      const childrenMetas = items?.filter(i => i.type === 'meta' && i.id) as Required<ICollectionItem>[]
      const map = MetaStore.getMetaObjectsMap()
      const collectionMap = globalStore.get(collectionsAtom)
      childrenCollections.sort((a, b) =>
        (collectionMap.get(a.id)?.name || '1').localeCompare(collectionMap.get(b.id)?.name || '1', undefined, {
          numeric: true,
          sensitivity: 'base'
        })
      )
      if (!onlyCollection) {
        childrenMetas.sort((a, b) =>
          (map.get(a.id)?.name || '1').localeCompare(map.get(b.id)?.name || '1', undefined, { numeric: true, sensitivity: 'base' })
        )
      }
      return {
        childrenCollections,
        childrenMetas: onlyCollection ? [] : childrenMetas
      }
    }, [items])

    const allMetas = MetaStore.useMetaObjectsMap()
    const allCollections = useGlobalAtomValue(collectionsAtom)

    const childrenCollectionsSize = childrenCollections.filter(u => !allCollections.get(u.id)?.deleted).length
    const childrenMetasSize = childrenMetas.filter(i => !allMetas.get(i.id)?.deleted && allMetas.has(i.id)).length

    const childrenLength = childrenCollectionsSize + childrenMetasSize

    const hideChildren = !collection?.toggled

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
        onDelete: () => collection && deleteCollection(collection.id, false),
        onEdit: toggleEditModalVisible,
        onDeleteWithMeta: () => collection && deleteCollection(collection.id, true)
      }
    )

    if (!collection || collection.deleted) return null

    return (
      <Content
        flex
        column
        style={{
          userSelect: 'none'
        }}
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
          visible={hovered && !droppable}
          padding={10}
          content={
            <div
              style={{
                fontSize: FontSize['12px'],
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
          <DraggableElement
            onDragStart={() => {
              sidebarDraggingState.current = {
                draggingItemId: collection.id,
                draggingItemType: 'collection',
                itemIsInRoot: parentId === 0,
                sourceFromId: parentId,
                sourceFromType: parentType
              }
            }}
            draggable={draggable}
            draggingDetails={{ type: 'collection', collectionId: collection.id }}
          >
            <Content
              flex
              onClick={e => {
                onClick?.(e, {
                  type: 'collection',
                  id
                })
              }}
              alignItems="center"
              justifyContent="space-between"
              className={css([ClassName.flatButton(4, '3px 8px 3px 2px'), hovered && ClassName.Drag.droppableItemHovered(droppable)])}
            >
              <Content flex gap={4}>
                <Icon
                  onClick={e => {
                    e.stopPropagation()
                    CollectionStore.updateCollection({ ...collection, toggled: !collection.toggled }, true)
                  }}
                  style={{
                    transform: !hideChildren ? 'rotate(90deg)' : undefined,
                    transition: 'all 0.2s ease',
                    transformOrigin: 'center'
                  }}
                  size={14}
                  theme="filled"
                  name="park-right-one"
                />
                {collection && (
                  <IconNameItem
                    onClick={e => {
                      Rendevoz.Actions.Open.Group.openCollectionGroup(collection.id)
                    }}
                    style={{ fontSize: FontSize['13px'] }}
                    name={collection.name || 'Unnamed Collection'}
                    color={collection.color}
                    icon={collection.icon || 'park-folder-close'}
                  />
                )}
              </Content>
              {childrenLength ? <div className={ClassName.description(FontSize['13px'])}>{childrenLength}</div> : undefined}
            </Content>
          </DraggableElement>
        </AnimatePopover>
        <AnimatePresence>
          {!hideChildren && (
            <div
              className={css({
                paddingLeft: 15,
                display: 'flex',
                flexDirection: 'column'
              })}
            >
              {childrenCollections?.map(i => (
                <SidebarCollectionItem
                  selectMode={selectMode}
                  onClick={onClick}
                  onlyCollection={onlyCollection}
                  key={i.id}
                  id={i.id}
                  parentId={id}
                  parentType="collection"
                />
              ))}
              {!onlyCollection && childrenMetas.map(i => <SidebarObjectItem key={i.id} id={i.id} parentId={id} parentType="collection" />)}
            </div>
          )}
        </AnimatePresence>
      </Content>
    )
  }
)

export default SidebarCollectionItem
