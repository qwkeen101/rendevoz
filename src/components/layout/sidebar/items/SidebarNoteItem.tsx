import { Modal, Content } from '@/components'
import NoteForm from '@/components/form/NoteForm'
import createNoteStore, { notesAtom } from '@/stores/note.store'
import { globalStore } from '@/stores'
import { css } from '@emotion/css'
import { useAtomValue } from 'jotai'
import { useRef, useMemo, FC } from 'react'
import { useToggle } from '@/hooks'
import { IconNameItem } from '../SidebarCollection'
import useSidebarItemContextMenu from '../useSidebarItemContextMenu'
import useSidebarItemDrag from '../useSidebarItemDrag'
import { ISidebarItem } from './type'
import { selectAtom } from 'jotai/utils'
import Actions from '@/Actions'

const SidebarNoteItem: FC<ISidebarItem> = ({ id, parentId, parentType, draggable = true }) => {
  const ref = useRef<HTMLDivElement>(null)
  const noteAtom = useMemo(() => selectAtom(notesAtom, n => n.get(id)), [id])
  const note = useAtomValue(noteAtom, { store: globalStore })
  const [editModalVisible, toggleEditModalVisible] = useToggle(false)
  draggable &&
    useSidebarItemDrag({
      id,
      type: 'note',
      parentId,
      parentType,
      isInRoot: false,
      draggableElementRef: ref,
      droppableElementRef: ref
    })
  const { updateNote, deleteNote } = createNoteStore()
  const { contextMenuPortal } = useSidebarItemContextMenu(
    ref,
    { type: 'note', id },
    {
      pinned: note?.pinned,
      onEdit: toggleEditModalVisible,
      onPin: () => {
        note &&
          updateNote({
            id: id,
            pinned: !note.pinned
          })
      },
      onDelete: () => note && deleteNote(id)
    }
  )
  if (!note || note.deleted) return null
  return (
    <Content
      flex
      gap={10}
      ref={ref}
      onClick={() => Actions.openEditor(id)}
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
      <Modal visible={editModalVisible} onClose={toggleEditModalVisible} noStyle>
        <NoteForm
          onBack={toggleEditModalVisible}
          initialObject={note}
          onSubmit={n => {
            n.id && updateNote(n)
            toggleEditModalVisible()
          }}
        />
      </Modal>
      {contextMenuPortal}
      <IconNameItem icon={note.icon || 'park-notes'} name={note.title} color={note.color} />
    </Content>
  )
}

export default SidebarNoteItem
