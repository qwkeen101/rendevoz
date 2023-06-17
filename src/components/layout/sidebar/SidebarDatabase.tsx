import { AnimatePopover, Icon } from '@/components'
import { useGlobalIsDragging } from '@/core'
import { useMemoizedFn } from '@/hooks'
import { objectIdToMetaObjectIdMapAtom, undeletedMetaObjectsAtom } from '@/stores/meta.store'
import { globalStore } from '@/stores'
import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import { useAtomValue } from 'jotai/react'
import { memo, useEffect, useRef, useState } from 'react'
import { MenuItem } from './Item'
import { useTranslation } from 'react-i18next'
import { Rendevoz } from '@/core/rendevoz'

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
            objectId = draggingEle.highlightId
            break
          case 'whiteboard':
            objectId = draggingEle.whiteboardId
            break
          case 'image':
            droppable = true
            break
          case 'videoLabel':
            objectId = draggingEle.id
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
              fontSize: '0.857rem'
            }}
          >
            {draggingHovered.alreadyExist
              ? t('database.object already exist')
              : draggingHovered.droppable
              ? t('database.drop to add object into database')
              : t(`database.can't add this type of object`)}
          </div>
        }
      >
        <MenuItem
          onClick={Rendevoz.Actions.Open.openDatabase}
          className={css([draggingHovered.visible ? ClassName.Drag.droppableItemHovered(draggingHovered.droppable) : undefined])}
          style={{
            background: draggingHovered.visible ? 'white' : undefined,
            position: 'relative',
            overflow: 'visible'
          }}
        >
          <Icon name="park-data" style={{ marginRight: 10 }} size={16} />
          {t('sidebar.database')}
          <div style={{ marginLeft: 'auto', fontSize: '0.857rem' }}>{undeletedMetaObjects.length}</div>
        </MenuItem>
      </AnimatePopover>
    </>
  )
})

export default SidebarDatabase
