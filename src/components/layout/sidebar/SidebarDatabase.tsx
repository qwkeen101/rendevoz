import { AnimatePopover, Button, Icon, Modal, WithBorder } from '@/components'
import { GlobalDragOverlayInstance, useGlobalIsDragging } from '@/core'
import { useGlobalEventEmitter } from '@/events/useEventEmitter'
import { useMemoizedFn, useToggle } from '@/hooks'
import { undeletedMetaObjectsAtom } from '@/stores/meta.store'
import { globalStore, NoteStore, ObjectStore } from '@/stores'
import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import { useAtomValue } from 'jotai/react'
import { memo, useEffect, useRef, useState } from 'react'
import { MenuItem } from './Item'
import { useTranslation } from 'react-i18next'
import Actions from '@/core/Actions'
import CreateDocumentForm from '@/components/form/CreateDocumentForm'
import Id from '@/utils/id'

const SidebarDatabase = memo(() => {
  const { t } = useTranslation()
  const [globalIsDragging] = useGlobalIsDragging()
  const itemRef = useRef<HTMLLIElement>(null)
  const emitter = useGlobalEventEmitter()
  const [draggingHovered, setDraggingHovered] = useState({
    droppable: false,
    visible: false
  })
  const [contextMenuPopVisible, toggleContextMenuPopVisible] = useToggle(false)
  const [formState, setFormState] = useState<{
    docV: boolean
  }>()
  const dragHandler = useMemoizedFn((e: DragEvent) => {
    if (e.type === 'dragover') {
      e.preventDefault()
    }
    if (e.type === 'drop') {
      console.log(e)
    }
  })

  const pointerHandler = useMemoizedFn((e: PointerEvent) => {
    if (!globalIsDragging) return
    if (e.type === 'pointerenter') {
      let droppable = false
      const draggingEle = GlobalDragOverlayInstance.draggingDetails
      if (draggingEle) {
        switch (draggingEle.type) {
          case 'noteElement':
          case 'pdfElement':
          case 'image':
            droppable = true
            break
          default:
            droppable = false
        }
      }
      setDraggingHovered({
        visible: true,
        droppable: droppable
      })
    } else {
      setDraggingHovered({
        visible: false,
        droppable: false
      })
    }
    if (e.type === 'pointerup') {
      const draggingEle = GlobalDragOverlayInstance.draggingDetails
      if (draggingEle && draggingHovered.droppable) {
        emitter.emit('global', {
          type: 'globalDropNeedFurtherProcess',
          data: {
            dropOn: 'database',
            draggingElement: draggingEle
          }
        })
      }
    }
  })
  const contextMenuHandler = () => {
    toggleContextMenuPopVisible(true)
  }
  useEffect(() => {
    const databaseContainer = itemRef.current
    if (databaseContainer) {
      databaseContainer.addEventListener('pointerenter', pointerHandler)
      databaseContainer.addEventListener('pointerup', pointerHandler)
      databaseContainer.addEventListener('pointerleave', pointerHandler)
      databaseContainer.addEventListener('drop', dragHandler)
      databaseContainer.addEventListener('dragover', dragHandler)
      databaseContainer.addEventListener('contextmenu', contextMenuHandler)
      return () => {
        databaseContainer.removeEventListener('pointerenter', pointerHandler)
        databaseContainer.removeEventListener('pointerup', pointerHandler)
        databaseContainer.removeEventListener('pointerleave', pointerHandler)
        databaseContainer.removeEventListener('drop', dragHandler)
        databaseContainer.removeEventListener('dragover', dragHandler)
        databaseContainer.removeEventListener('contextmenu', contextMenuHandler)
      }
    }
  }, [])
  const undeletedMetaObjects = useAtomValue(undeletedMetaObjectsAtom, { store: globalStore })

  return (
    <>
      <Modal visible={!!formState?.docV} onClose={() => setFormState(undefined)}>
        {formState?.docV && (
          <CreateDocumentForm
            onBack={() => setFormState(undefined)}
            onSubmit={doc => {
              setFormState(undefined)
            }}
          />
        )}
      </Modal>
      <AnimatePopover
        innerRef={itemRef}
        visible={draggingHovered.visible || contextMenuPopVisible}
        onClickOutside={() => {
          if (contextMenuPopVisible) {
            toggleContextMenuPopVisible(false)
          }
        }}
        positions={['top']}
        containerStyle={{ zIndex: '10000' }}
        padding={10}
        content={
          contextMenuPopVisible ? (
            <WithBorder onClick={toggleContextMenuPopVisible}>
              <Button.IconButton
                icon="park-file-pdf"
                text={t('general.pdf')}
                onClick={() => {
                  setFormState({ docV: true })
                }}
              />
              <Button.IconButton
                icon="park-web-page"
                text={t('general.webpage')}
                onClick={() => {
                  ObjectStore('webpage').addOne({
                    title: 'Unknown webpage'
                  })
                }}
              />
              <Button.IconButton
                icon="park-notes"
                text={t('general.note')}
                onClick={() => {
                  NoteStore.addNote({
                    contentId: Id.getId(),
                    title: 'Untitled'
                  }).then(n => {
                    Actions.openEditor(n.id)
                  })
                }}
              />
            </WithBorder>
          ) : (
            <div
              style={{
                pointerEvents: 'none',
                background: 'rgba(0,0,0,0.8)',
                color: 'white',
                padding: '2px 6px',
                borderRadius: 4,
                fontSize: 12
              }}
            >
              {draggingHovered.droppable ? 'Drop to add object into database' : "Can't drop this type of object"}
            </div>
          )
        }
      >
        <MenuItem
          onClick={Actions.openDatabase}
          className={css([draggingHovered.visible ? ClassName.Drag.droppableItemHovered(draggingHovered.droppable) : undefined])}
          style={{
            background: draggingHovered.visible ? 'white' : undefined,
            position: 'relative',
            overflow: 'visible'
          }}
        >
          <Icon name="park-data" style={{ marginRight: 10 }} size={16} />
          {t('sidebar.database')}
          <div style={{ marginLeft: 'auto', fontSize: 12 }}>{undeletedMetaObjects.length}</div>
        </MenuItem>
      </AnimatePopover>
    </>
  )
})

export default SidebarDatabase
