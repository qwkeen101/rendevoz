import { AnimatePopover, Icon } from '@/components'
import { GlobalDragOverlayInstance, useGlobalIsDragging } from '@/core'
import { useGlobalEventEmitter } from '@/events/useEventEmitter'
import { useMemoizedFn } from '@/hooks'
import { objectIdToMetaObjectIdMapAtom, undeletedMetaObjectsAtom } from '@/stores/meta.store'
import { globalStore } from '@/stores'
import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import { useAtomValue } from 'jotai/react'
import { memo, useEffect, useRef, useState } from 'react'
import { MenuItem } from './Item'
import { useTranslation } from 'react-i18next'
import Actions from '@/core/Actions'

const SidebarDatabase = memo(() => {
  const { t } = useTranslation()
  const [globalIsDragging] = useGlobalIsDragging()
  const itemRef = useRef<HTMLLIElement>(null)
  const emitter = useGlobalEventEmitter()
  const [draggingHovered, setDraggingHovered] = useState({
    droppable: false,
    visible: false,
    alreadyExist: false
  })

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
      const objectIdToMetaObjectIdMap = globalStore.get(objectIdToMetaObjectIdMapAtom)
      let objectId: number | undefined = undefined
      let alreadyExist = false
      if (draggingEle) {
        switch (draggingEle.type) {
          case 'noteBlock':
            objectId = draggingEle.blockId
            break
          case 'pdfLabel':
            objectId = draggingEle.labelId
            break
          case 'webpage label':
            objectId = draggingEle.highlightId
            break
          case 'pdf':
            objectId = draggingEle.pdfId
            break
          case 'note':
            objectId = draggingEle.noteId
            break
          case 'note label':
            break
          case 'whiteboard':
            objectId = draggingEle.whiteboardId
            break
          case 'image':
            droppable = true
            break
          default:
            droppable = false
        }
        if (objectId !== undefined && !objectIdToMetaObjectIdMap?.has(objectId)) droppable = true
        if ((objectId && objectIdToMetaObjectIdMap?.has(objectId)) || draggingEle.type === 'metaElement') alreadyExist = true
      }
      setDraggingHovered({
        visible: true,
        droppable: droppable,
        alreadyExist
      })
    } else {
      setDraggingHovered({
        ...draggingHovered,
        visible: false
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

  useEffect(() => {
    const databaseContainer = itemRef.current
    if (databaseContainer) {
      databaseContainer.addEventListener('pointerenter', pointerHandler)
      databaseContainer.addEventListener('pointerup', pointerHandler)
      databaseContainer.addEventListener('pointerleave', pointerHandler)
      databaseContainer.addEventListener('drop', dragHandler)
      databaseContainer.addEventListener('dragover', dragHandler)
      return () => {
        databaseContainer.removeEventListener('pointerenter', pointerHandler)
        databaseContainer.removeEventListener('pointerup', pointerHandler)
        databaseContainer.removeEventListener('pointerleave', pointerHandler)
        databaseContainer.removeEventListener('drop', dragHandler)
        databaseContainer.removeEventListener('dragover', dragHandler)
      }
    }
  }, [])
  const undeletedMetaObjects = useAtomValue(undeletedMetaObjectsAtom, { store: globalStore })

  return (
    <>
      <AnimatePopover
        innerRef={itemRef}
        visible={draggingHovered.visible}
        positions={['top']}
        containerStyle={{ zIndex: '10000' }}
        padding={10}
        content={
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
            {draggingHovered.alreadyExist
              ? 'Object Already Exist'
              : draggingHovered.droppable
              ? 'Drop to add object into database'
              : "Can't drop this type of object"}
          </div>
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
