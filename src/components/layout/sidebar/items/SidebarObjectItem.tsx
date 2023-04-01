import { Content } from '@/components'
import Actions from '@/core/Actions'
import { GlobalEventEmitter } from '@/events'
import { useGlobalAtomValue } from '@/hooks'
import { MetaStore } from '@/stores'
import { metaObjectsAtom } from '@/stores/meta.store'
import { ObjectFamily } from '@/stores/object.store'
import { css } from '@emotion/css'
import { selectAtom } from 'jotai/utils'
import { FC, useMemo, useRef } from 'react'
import { IconNameItem } from '../SidebarCollection'
import useSidebarItemContextMenu from '../useSidebarItemContextMenu'
import useSidebarItemDrag from '../useSidebarItemDrag'
import { ISidebarItem } from './type'

const SidebarObjectItem: FC<ISidebarItem> = ({ parentId, parentType, id }) => {
  const metaObjectAtom = useMemo(() => selectAtom(metaObjectsAtom, m => m.get(id)), [id])
  const metaObject = useGlobalAtomValue(metaObjectAtom)
  const ref = useRef<HTMLDivElement>(null)
  const icon = metaObject?.type === 'webpage' ? 'park-web-page' : undefined
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
  if (metaObject?.deleted) return null
  return (
    <Content
      flex
      gap={10}
      ref={ref}
      onClick={() => Actions.navigateToTargetObject(id)}
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
      <IconNameItem icon={icon} name={metaObject?.name} />
    </Content>
  )
}

export default SidebarObjectItem
