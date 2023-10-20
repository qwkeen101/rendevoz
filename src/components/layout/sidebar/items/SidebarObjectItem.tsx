import { Content } from '@/components'
import { GlobalEventEmitter } from '@/events'
import { useGlobalAtomValue } from '@/hooks'
import { CollectionStore, MetaStore } from '@/stores'
import { metaObjectsAtom } from '@/stores/meta.store'
import { selectAtom } from 'jotai/utils'
import { FC, useMemo, useRef } from 'react'
import { IconNameItem } from '../SidebarCollection'
import useSidebarItemContextMenu from '../useSidebarItemContextMenu'
import useSidebarItemDrag from '../useSidebarItemDrag'
import { ISidebarItem } from './type'
import { toast } from 'react-hot-toast'
import ClassName from '@/styles/classNames'
import FontSize from '@/consts/font'
import { Rendevoz } from '@/core/rendevoz'
import HoverObjectDetails from '@/core/object/HoverObjectDetails'

const SidebarObjectItem: FC<ISidebarItem> = ({ parentId, parentType, id, draggable = true }) => {
  const metaObjectAtom = useMemo(() => selectAtom(metaObjectsAtom, m => m.get(id)), [id])
  const metaObject = useGlobalAtomValue(metaObjectAtom)
  const ref = useRef<HTMLDivElement>(null)
  const icon = Rendevoz.Utils.Object.getMetaObjectIcon(metaObject?.type)
  draggable &&
    useSidebarItemDrag({
      id,
      type: 'meta',
      parentId,
      parentType,
      isInRoot: false,
      draggableElementRef: ref,
      droppableElementRef: ref
    })
  const { contextMenuPortal } = useSidebarItemContextMenu(
    ref,
    { type: 'meta', id },
    {
      pinned: metaObject?.pinned,
      onRemoveFromCollection: () => {
        if (parentType === 'whiteboard') {
          toast.error('You can not remove from whiteboard!')
          return
        }
        if (parentType === 'collection' && parentId) {
          CollectionStore.getCollectionById(parentId).then(collection => {
            if (collection) {
              CollectionStore.updateCollection({
                id: parentId,
                items: collection?.items?.filter(i => i.id !== id)
              })
            }
          })
        }
      },
      onEdit: () =>
        GlobalEventEmitter().emit('global', {
          type: 'globalNeedEditMetaObject',
          data: {
            metaObjectId: id
          }
        }),
      onPin: () => {
        metaObject && MetaStore.updateMetaObject({ id, pinned: !metaObject.pinned }, true)
      },
      onDelete: () => metaObject && MetaStore.deleteMetaObject(id)
    }
  )
  if (metaObject?.deleted || !metaObject) return null
  return (
    <HoverObjectDetails ref={ref} metaObjectId={metaObject.id} positions={['right']}>
      <Content
        flex
        gap={10}
        onClick={() => Rendevoz.Actions.Open.Meta.openMetaObject(id)}
        className={ClassName.flatButton(4, '3px 8px')}
      >
        {contextMenuPortal}
        <IconNameItem
          style={{ fontSize: FontSize['12px'] }}
          icon={metaObject?.icon || icon}
          name={metaObject?.name}
          color={metaObject?.color}
        />
      </Content>
    </HoverObjectDetails>
  )
}

export default SidebarObjectItem
