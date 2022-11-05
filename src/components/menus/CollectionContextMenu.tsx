import { Noop } from '@/common/types'
import useCollectionStore from '@/stores/collection.store'
import { FC } from 'react'
import { Icon } from '..'
import Menu from '../base/menu'
import useCurrentCollectionContextMenuItem from '../collection/useCurrentContextMenuItem'
import useCurrentCopy from '../collection/useCurrentCopy'
import useCurrentCut from '../collection/useCurrentCut'

const CollectionContextMenu: FC<
  Partial<{
    onOpen: Noop
    onRename: Noop
    onDelete: Noop
    onCopy: Noop
    onPaste: Noop
    onCut: Noop
  }>
> = ({ onOpen, onDelete, onRename, onCopy, onCut, onPaste }) => {
  const [currentCopy] = useCurrentCopy()
  const [currentCut] = useCurrentCut()
  const [currentCollectionContextMenuItem] = useCurrentCollectionContextMenuItem()

  let enablePaste = true
  if (currentCollectionContextMenuItem && currentCollectionContextMenuItem?.type === 'root') {
    enablePaste = false
  }
  if (!currentCopy && !currentCut) {
    enablePaste = false
  }
  if (
    currentCollectionContextMenuItem &&
    (currentCopy?.collection === currentCollectionContextMenuItem?.collection ||
      currentCut?.collection === currentCollectionContextMenuItem?.collection)
  ) {
    enablePaste = false
  }
  return (
    <Menu>
      {currentCollectionContextMenuItem && currentCollectionContextMenuItem.type !== 'root' && (
        <>
          <Menu.Item onClick={onOpen} gap={4} icon={<Icon size={14} name="park-preview-open" />} type="button">
            Open
          </Menu.Item>
          <Menu.Item onClick={onRename} gap={4} icon={<Icon size={14} name="park-edit" />} type="button">
            Rename
          </Menu.Item>
          <Menu.Item onClick={onCopy} gap={4} icon={<Icon size={14} name="park-copy" />} type="button">
            Copy
          </Menu.Item>
          <Menu.Item onClick={onCut} gap={4} icon={<Icon size={14} name="park-cutting-one" />} type="button">
            Cut
          </Menu.Item>
        </>
      )}
      {(currentCollectionContextMenuItem?.type === 'root' ||
        currentCollectionContextMenuItem?.type === 'collection' ||
        currentCollectionContextMenuItem === null) && (
        <Menu.Item onClick={onPaste} disabled={!enablePaste} gap={4} icon={<Icon size={14} name="park-copy-one" />} type="button">
          Paste
        </Menu.Item>
      )}
      {currentCollectionContextMenuItem && currentCollectionContextMenuItem.type !== 'root' && (
        <Menu.Item onClick={onDelete} gap={4} icon={<Icon size={14} name="park-delete" />} type="button">
          Delete
        </Menu.Item>
      )}
    </Menu>
  )
}

export default CollectionContextMenu
