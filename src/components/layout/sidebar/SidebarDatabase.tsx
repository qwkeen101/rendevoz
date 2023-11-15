import { AnimatePopover, Icon } from '@/components'
import { useGlobalIsDragging } from '@/core'
import { useMemoizedFn } from '@/hooks'
import { objectIdToMetaObjectIdMapAtom } from '@/api/stores/meta.store'
import { globalStore } from '@/api/stores'
import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import { memo, useEffect, useRef, useState } from 'react'
import { MenuItem } from './Item'
import { useTranslation } from 'react-i18next'
import { Rendevoz } from '@/core/rendevoz'
import { TypeToRegisteredObject } from '@/api/stores/object.store'
import { setPanelState } from '@/components/layout/sidebar/index'

const SidebarDatabase = memo(() => {
  const { t } = useTranslation()
  const [globalIsDragging] = useGlobalIsDragging()
  const itemRef = useRef<HTMLLIElement>(null)
  const emitter = Rendevoz.Events.Emit.GlobalEventEmitter
  const [draggingHovered, setDraggingHovered] = useState({
    droppable: false,
    visible: false,
    alreadyExist: false
  })
  const dragHandler = useMemoizedFn((e: DragEvent) => {
    if (e.type === 'dragover') {
      e.preventDefault()
      setDraggingHovered({
        droppable: true,
        visible: true,
        alreadyExist: false
      })
    }
    if (e.type === 'dragleave') {
      setDraggingHovered(s => ({ ...s, visible: false }))
    }
    if (e.type === 'drop') {
      setDraggingHovered(s => ({ ...s, visible: false }))
      e.preventDefault()
      if (e.dataTransfer?.files[0]) {
        Rendevoz.Utils.Meta.addMetaObjectFromFile(e.dataTransfer.files[0]).then(res => {
          if (!res) {
            emitter.emit('global', {
              type: 'globalDropNeedFurtherProcess',
              data: {
                dropOn: {
                  dropOn: 'database'
                },
                e
              }
            })
          }
        })
      } else {
        emitter.emit('global', {
          type: 'globalDropNeedFurtherProcess',
          data: {
            dropOn: {
              dropOn: 'database'
            },
            e
          }
        })
      }
    }
  })
  const DragState = Rendevoz.Actions.State.Drag
  const pointerHandler = useMemoizedFn((e: PointerEvent) => {
    if (!globalIsDragging) return
    if (e.type === 'pointerenter') {
      let droppable = false
      const draggingEle = DragState.getDraggingDetails()
      const objectIdToMetaObjectIdMap = globalStore.get(objectIdToMetaObjectIdMapAtom)
      let objectId: number | undefined = undefined
      let alreadyExist = false
      if (draggingEle) {
        if (draggingEle.type && TypeToRegisteredObject.has(draggingEle.type)) {
          const { getObjectIdFromDraggingEle } = TypeToRegisteredObject.get(draggingEle.type)!
          objectId = getObjectIdFromDraggingEle?.(draggingEle)
        }
        switch (draggingEle.type) {
          case 'noteBlock':
            objectId = draggingEle.blockId
            break
          case 'videoLabel':
          case 'audioLabel':
          case 'pdfLabel':
          case 'webpageLabel':
          case 'noteLabel':
            objectId = draggingEle.labelId
            break
          case 'pdf':
            objectId = draggingEle.pdfId
            break
          case 'note':
            objectId = draggingEle.noteId
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
        console.log(objectId)
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
      const draggingEle = DragState.getDraggingDetails()
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
      databaseContainer.addEventListener('dragleave', dragHandler)
      return () => {
        databaseContainer.removeEventListener('pointerenter', pointerHandler)
        databaseContainer.removeEventListener('pointerup', pointerHandler)
        databaseContainer.removeEventListener('pointerleave', pointerHandler)
        databaseContainer.removeEventListener('drop', dragHandler)
        databaseContainer.removeEventListener('dragover', dragHandler)
        databaseContainer.removeEventListener('dragleave', dragHandler)
      }
    }
  }, [])

  return (
    <>
      <MenuItem
        ref={itemRef}
        onClick={() => {
          setPanelState(s => {
            if (s.visible.has('database')) {
              s.visible.delete('database')
            } else {
              s.visible.add('database')
            }
          })
        }}
        className={css([draggingHovered.visible ? ClassName.Drag.droppableItemHovered(draggingHovered.droppable) : undefined])}
        style={{
          background: draggingHovered.visible ? 'white' : undefined,
          position: 'relative',
          overflow: 'visible'
        }}
      >
        <Icon name="park-data" size={20} />
      </MenuItem>
    </>
  )
})

export default SidebarDatabase
