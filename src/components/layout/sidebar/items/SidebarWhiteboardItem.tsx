import { Content, Icon, Modal } from '@/components'
import WhiteboardForm from '@/components/form/WhiteboardForm'
import { useToggle } from '@/hooks'
import { whiteboardsAtom } from '@/stores/whiteboard.store'
import { css } from '@emotion/css'
import { AnimatePresence, motion } from 'framer-motion'
import { useAtomValue } from 'jotai'
import { selectAtom } from 'jotai/utils'
import { FC, memo, useMemo, useRef } from 'react'
import { ICollectionItem } from '~/typings/data'
import { IconNameItem } from '../SidebarCollection'
import useSidebarItemDrag from '../useSidebarItemDrag'
import SidebarDocumentItem from './SidebarDocumentItem'
import SidebarNoteItem from './SidebarNoteItem'
import { ISidebarItem } from './type'
import { WhiteboardStore } from '@/stores'
import useSidebarItemContextMenu from '../useSidebarItemContextMenu'
import Actions from '@/Actions'

const SidebarWhiteboardItem: FC<ISidebarItem> = memo(({ id, parentId, parentType, draggable = true }) => {
  const thisWhiteboardAtom = useMemo(() => selectAtom(whiteboardsAtom, w => w.get(id)), [id])
  const whiteboard = useAtomValue(thisWhiteboardAtom)
  const items = whiteboard?.items
  const { noteItems, documentItems } = useMemo(() => {
    const noteItems = items?.filter(i => i.id && i.type === 'note') as Required<ICollectionItem>[]
    const documentItems = items?.filter(i => i.id && i.type === 'document') as Required<ICollectionItem>[]
    // const videoItems = items?.filter(i => i.id && i.type === 'video') as ICollectionItem[]
    return { noteItems, documentItems }
  }, [items])
  const { updateWhiteboard, deleteWhiteboard } = WhiteboardStore
  const [showChildrenItems, toggleShowChildrenItems] = useToggle(false)
  const ref = useRef<HTMLDivElement>(null)
  const [editModalVisible, toggleEditModalVisible] = useToggle(false)
  draggable &&
    useSidebarItemDrag({
      id,
      type: 'whiteboard',
      parentId,
      parentType,
      isInRoot: false,
      draggableElementRef: ref,
      droppableElementRef: ref
    })
  const { contextMenuPortal } = useSidebarItemContextMenu(
    ref,
    { type: 'whiteboard', id },
    {
      pinned: whiteboard?.pinned,
      onEdit: toggleEditModalVisible,
      onPin: () => {
        whiteboard &&
          updateWhiteboard({
            id: id,
            pinned: !whiteboard.pinned
          })
      },
      onDelete: () => whiteboard && deleteWhiteboard(id)
    }
  )
  if (!whiteboard || whiteboard.deleted) return null
  return (
    <>
      <Modal visible={editModalVisible} onClose={toggleEditModalVisible} noStyle>
        <WhiteboardForm
          onBack={toggleEditModalVisible}
          onSubmit={w => {
            toggleEditModalVisible()
            whiteboard?.id &&
              updateWhiteboard({
                ...w,
                id: whiteboard.id
              })
          }}
          initialObject={whiteboard}
        />
      </Modal>
      <Content
        flex
        ref={ref}
        className={css({
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          borderRadius: 4,
          padding: '2px 2px 2px 14px',
          ':hover': {
            background: 'rgba(0,0,0,0.07)'
          }
        })}
      >
        <Icon
          className={css({
            transform: showChildrenItems ? 'rotate(90deg)' : undefined,
            transition: 'all 0.2s ease',
            transformOrigin: 'center',
            position: 'absolute',
            left: -14
          })}
          onClick={toggleShowChildrenItems}
          size={12}
          theme="filled"
          name="park-right-one"
        />
        <IconNameItem
          onClick={() => Actions.openWhiteboard(id)}
          name={whiteboard?.name || 'Unnamed Whiteboard'}
          color={whiteboard?.color}
          icon={whiteboard?.icon || 'park-new-computer'}
        />
      </Content>
      {contextMenuPortal}
      <AnimatePresence>
        {showChildrenItems && (
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
            {noteItems?.map(i => (
              <SidebarNoteItem key={i.id} id={i.id} parentId={id} parentType="whiteboard" />
            ))}
            {documentItems?.map(i => (
              <SidebarDocumentItem key={i.id} id={i.id} parentId={id} parentType="whiteboard" />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
})

export default SidebarWhiteboardItem
