import { AnimatePopover, Content, WithBorder } from '@/components'
import { GlobalEventEmitter } from '@/events'
import { useGlobalAtomValue, useIsIn } from '@/hooks'
import { CollectionStore, MetaStore } from '@/api/stores'
import { metaObjectsAtom } from '@/api/stores/meta/meta.store'
import { selectAtom } from 'jotai/utils'
import { FC, useMemo} from 'react'
import { IconNameItem } from '../SidebarCollection'
import useSidebarItemContextMenu from '../useSidebarItemContextMenu'
import useSidebarItemDrag from '../useSidebarItemDrag'
import { ISidebarItem } from './type'
import { toast } from 'react-hot-toast'
import ClassName from '@/styles/classNames'
import { Rendevoz } from '@/core/rendevoz'
import { DraggableElement, GlobalSetting } from '@/core'
import usePreviewItem from '@/components/layout/sidebar/usePreviewItem'

const SidebarObjectItem: FC<ISidebarItem> = ({ parentId, parentType, id, draggable = true }) => {
  const metaObjectAtom = useMemo(() => selectAtom(metaObjectsAtom, m => m.get(id)), [id])
  const metaObject = useGlobalAtomValue(metaObjectAtom)
  const preview = useGlobalAtomValue(GlobalSetting.atoms.previewCollectionContentAtom)
  const icon = Rendevoz.Utils.Object.getMetaObjectIcon(metaObject?.type)
  const { ref, wrapper } = usePreviewItem(!!preview, id)
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
        metaObject && MetaStore.updateMetaObject({ id, pinned: !metaObject.pinned })
      },
      onDelete: () => metaObject && MetaStore.deleteMetaObject(id)
    }
  )
  if (metaObject?.deleted || !metaObject) return null
  return wrapper(
    <DraggableElement
      draggingDetails={{
        type: 'metaElement',
        metaId: metaObject.id
      }}
    >
      <Content
        flex
        gap={10}
        onClick={() => {
          Rendevoz.Actions.Open.Meta.openMetaObject(id)
        }}
        className={'button py-3 px-8'}
      >
        {contextMenuPortal}
        <IconNameItem
          className={'font-size-13'}
          icon={metaObject?.icon || icon}
          name={metaObject?.name || metaObject?.placeholderName}
          color={metaObject?.color}
        />
      </Content>
    </DraggableElement>
  )
}

export default SidebarObjectItem
