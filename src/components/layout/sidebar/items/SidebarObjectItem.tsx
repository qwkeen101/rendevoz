import { Content } from '@/components'
import Actions from '@/core/Actions'
import { GlobalEventEmitter } from '@/events'
import { useGlobalAtomValue } from '@/hooks'
import { CollectionStore, MetaStore } from '@/stores'
import { metaObjectsAtom } from '@/stores/meta.store'
import { css } from '@emotion/css'
import { selectAtom } from 'jotai/utils'
import { FC, useMemo, useRef } from 'react'
import { MetaObject } from '~/typings'
import { IconNameItem } from '../SidebarCollection'
import useSidebarItemContextMenu from '../useSidebarItemContextMenu'
import useSidebarItemDrag from '../useSidebarItemDrag'
import { ISidebarItem } from './type'
import { toast } from 'react-hot-toast'
import ClassName from '@/styles/classNames'

export const getIcon = (type?: MetaObject['type']) => {
  switch (type) {
    case 'note':
      return 'park-notes'
    case 'pdf':
      return 'park-file-pdf'
    case 'webpage':
      return 'park-web-page'
    case 'webpageLabel':
    case 'noteBlock':
    case 'noteLabel':
    case 'pdfLabel':
      return 'park-label'
    case 'whiteboard':
      return 'park-new-computer'
  }
}
const SidebarObjectItem: FC<ISidebarItem> = ({ parentId, parentType, id, draggable = true }) => {
  const metaObjectAtom = useMemo(() => selectAtom(metaObjectsAtom, m => m.get(id)), [id])
  const metaObject = useGlobalAtomValue(metaObjectAtom)
  const ref = useRef<HTMLDivElement>(null)
  const icon = getIcon(metaObject?.type)
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
    <Content flex gap={10} ref={ref} onClick={() => Actions.navigateToTargetObject(id)} className={ClassName.flatButton(4, '2px 8px')}>
      {contextMenuPortal}
      <IconNameItem icon={metaObject?.icon || icon} name={metaObject?.name} color={metaObject?.color} />
    </Content>
  )
}

export default SidebarObjectItem
