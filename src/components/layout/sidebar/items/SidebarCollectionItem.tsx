import { AnimatePopover, Content } from '@/components'
import { CollectionStore, MetaStore } from '@/api/stores'
import { FC, memo, useMemo, useRef } from 'react'
import useSidebarItemContextMenu from '../useSidebarItemContextMenu'
import useSidebarItemDrag from '../useSidebarItemDrag'
import { ISidebarItem } from './type'
import SidebarObjectItem from './SidebarObjectItem'
import { DraggableElement } from '@/core'
import { SidebarExpandItem } from '@/components/layout/sidebar/main'
import usePasteMetaObject from '@/core/object/usePasteMetaObject'
import { compareStrings } from '@/utils/str'
import { Icons } from '@/consts'
import KeyvalueStore from '@/api/stores/keyvalue.store'
import { toggleItem } from '@/utils'

const SidebarCollectionItem: FC<ISidebarItem> = memo(({ id, pin, parentId, draggable = true, onClick }) => {
  const collection = CollectionStore.useValue(id)
  const items = collection?.items
  const sidebarExpandData = KeyvalueStore.useValue('sidebarExpandData')
  const collapseKey = `${pin ? 'pin' : 'collection'}_${id}`
  const expanded = sidebarExpandData?.includes(collapseKey)
  const inCollectionCollections = CollectionStore.useMultiple(
    useMemo(() => items?.filter(i => i.type === 'collection').map(i => i.id) || [], [items])
  )
  const inCollectionMetas = MetaStore.useMultiple(useMemo(() => items?.filter(i => i.type === 'meta').map(i => i.id) || [], [items]))
  const { childrenCollections, childrenMetas } = useMemo(() => {
    if (!items) {
      return {
        childrenMetas: [],
        childrenCollections: []
      }
    }
    const sortedCollections = inCollectionCollections.toSorted((a, b) => compareStrings(a.name, b.name))
    const sortedMetas = inCollectionMetas.filter(i => !i.deleted).toSorted((a, b) => compareStrings(a.name, b.name))
    return {
      childrenCollections: sortedCollections,
      childrenMetas: sortedMetas
    }
  }, [collection, inCollectionMetas, inCollectionCollections])
  const childrenCollectionsSize = childrenCollections.length
  const childrenMetasSize = childrenMetas.length
  const childrenLength = childrenCollectionsSize + childrenMetasSize
  const hideChildren = !expanded
  const ref = useRef<HTMLDivElement>(null)
  const { droppable, hovered } = draggable
    ? useSidebarItemDrag({
        id,
        type: 'collection',
        draggableElementRef: ref,
        droppableElementRef: ref,
        isInRoot: parentId === 0,
        parentId
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
      pinned: collection?.pinned
    }
  )
  usePasteMetaObject(ref, metas => {
    const currentItems = collection?.items
    const notInMetas = metas.filter(i => !currentItems?.some(o => o.id === i.id))
    if (notInMetas.length) {
      CollectionStore.addItemToCollection(
        notInMetas.map(i => ({
          type: 'meta',
          id: i.id
        })),
        id
      )
    }
  })
  if (!collection || collection.deleted) return null

  return (
    <Content
      flex
      column
      style={{
        userSelect: 'none'
      }}
    >
      {contextMenuPortal}
      <AnimatePopover
        visible={hovered && !droppable}
        padding={10}
        content={`${!droppable && "Can't"} Move into ${collection.name}`}
        positions={['top']}
        containerStyle={{ zIndex: '10000', pointerEvents: 'none' }}
        innerRef={ref}
      >
        <DraggableElement
          onDragStart={() => {
            CollectionStore.dragState = {
              draggingItemId: collection.id,
              draggingItemType: 'collection',
              sourceFromId: parentId
            }
          }}
          draggable={draggable}
          draggingDetails={{ type: 'collection', collectionId: collection.id }}
        >
          <div>
            <SidebarExpandItem
              expandable={childrenLength > 0}
              onExpand={() => {
                KeyvalueStore.updateOne('sidebarExpandData', toggleItem(sidebarExpandData, collapseKey))
              }}
              childrenSize={childrenLength}
              name={collection.name}
              color={collection.color}
              expanded={expanded}
              icon={Icons.Folder}
              style={
                hovered && droppable
                  ? {
                      background: 'var(--select-color-transparent-light)',
                      boxShadow: '0 0 0 1px var(--select-color)'
                    }
                  : undefined
              }
              onClick={e => {
                if (onClick) {
                  onClick?.(e, {
                    type: 'collection',
                    id
                  })
                  return
                }
                KeyvalueStore.updateOne('sidebarExpandData', toggleItem(sidebarExpandData, collapseKey))
              }}
            />
          </div>
        </DraggableElement>
      </AnimatePopover>
      {!hideChildren && (
        <div className={'pl-3'}>
          {childrenCollections?.map(i => <SidebarCollectionItem onClick={onClick} key={i.id} id={i.id} parentId={id} />)}
          {childrenMetas.map(i => (
            <SidebarObjectItem key={i.id} id={i.id} parentId={id} parentType="collection" />
          ))}
        </div>
      )}
    </Content>
  )
})

export default SidebarCollectionItem
