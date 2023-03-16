import { Modal, Content } from '@/components'
import DocumentForm from '@/components/form/DocumentForm'
import createDocumentStore, { documentsAtom } from '@/stores/document.store'
import { globalStore } from '@/stores'
import { css } from '@emotion/css'
import { useAtomValue } from 'jotai'
import { FC, useMemo, useRef } from 'react'
import { useToggle } from '@/hooks'
import useSidebarItemContextMenu from '../useSidebarItemContextMenu'
import useSidebarItemDrag from '../useSidebarItemDrag'
import { ISidebarItem } from './type'
import { selectAtom } from 'jotai/utils'
import { IconNameItem } from '../SidebarCollection'
import Actions from '@/Actions'

const SidebarDocumentItem: FC<ISidebarItem> = ({ id, parentId, parentType, draggable = true }) => {
  const documentAtom = useMemo(() => selectAtom(documentsAtom, d => d.get(id)), [id])
  const document = useAtomValue(documentAtom, { store: globalStore })
  const ref = useRef<HTMLDivElement>(null)
  const [editModalVisible, toggleEditModalVisible] = useToggle(false)
  draggable &&
    useSidebarItemDrag({
      id,
      type: 'document',
      draggableElementRef: ref,
      droppableElementRef: ref,
      isInRoot: false,
      parentId,
      parentType
    })
  const { updateDocument, deleteDocument } = createDocumentStore()
  const { contextMenuPortal } = useSidebarItemContextMenu(
    ref,
    { id, type: 'pdf' },
    {
      pinned: document?.pinned,
      onEdit: toggleEditModalVisible,
      onPin: () => document && updateDocument({ id, pinned: !document?.pinned }),
      onDelete: () => document && deleteDocument(id)
    }
  )

  if (!document || document.deleted) return null
  return (
    <Content
      flex
      gap={10}
      ref={ref}
      onClick={() => Actions.openPdf(id)}
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
      <Modal visible={editModalVisible} noStyle onClose={toggleEditModalVisible}>
        <DocumentForm
          onBack={toggleEditModalVisible}
          initialObject={document}
          onSubmit={obj => {
            updateDocument(obj)
            toggleEditModalVisible()
          }}
        />
      </Modal>
      <IconNameItem icon={document.icon || 'park-file-pdf'} name={document.name} color={document.color} />
    </Content>
  )
}

export default SidebarDocumentItem
