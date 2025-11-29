import { Button } from '@/components'
import { useGlobalAtomValue } from '@/hooks'
import { metaObjectsAtom } from '@/api/stores/meta/meta.store'
import { selectAtom } from 'jotai/utils'
import { FC, useMemo } from 'react'
import useSidebarItemContextMenu from '../useSidebarItemContextMenu'
import useSidebarItemDrag from '../useSidebarItemDrag'
import { ISidebarItem } from './type'
import { DraggableElement, GlobalSetting } from '@/core'
import usePreviewItem from '@/components/layout/sidebar/usePreviewItem'
import trans from '@/consts/trans'
import { useTranslation } from 'react-i18next'
import { CollectionStore } from '@/api/stores'

const SidebarObjectItem: FC<ISidebarItem> = ({ parentId, id, draggable = true }) => {
  const metaObjectAtom = useMemo(() => selectAtom(metaObjectsAtom, m => m.get(id)), [id])
  const metaObject = useGlobalAtomValue(metaObjectAtom)
  const preview = useGlobalAtomValue(GlobalSetting.atoms.previewCollectionContentAtom)
  const icon = Global.utils.getIcon(metaObject?.type)
  const { ref, wrapper } = usePreviewItem(!!preview, id)
  draggable &&
    useSidebarItemDrag({
      id,
      type: 'meta',
      parentId,
      isInRoot: false,
      draggableElementRef: ref,
      droppableElementRef: ref
    })
  const { contextMenuPortal } = useSidebarItemContextMenu(
    ref,
    { type: 'meta', id },
    {
      pinned: metaObject?.pinned,
      parentId: parentId
    }
  )
  const { t } = useTranslation()
  if (metaObject?.deleted || !metaObject) return null
  const name = Global.metaOps.getMetaName(metaObject)
  return wrapper(
    <DraggableElement
      draggingDetails={{
        type: 'metaObjects',
        ids: [metaObject.id]
      }}
      onDragStart={() => {
        CollectionStore.dragState = {
          draggingItemId: metaObject.id,
          draggingItemType: 'meta',
          sourceFromId: parentId
        }
      }}
    >
      <div>
        {contextMenuPortal}
        <Button.IconButton
          textClassName={!name ? 'super-transparent-font' : undefined}
          onClick={() => {
            Global.layoutOps?.openObject(metaObject.id)
          }}
          icon={icon}
          image={metaObject.coverImgSrc}
          text={name || t(trans.Unnamed)}
        />
      </div>
    </DraggableElement>
  )
}

export default SidebarObjectItem
