import { AnimatePopover, Icon } from '@/components'
import Modal from '@/components/base/Modal'
import EditMetaObjectForm from '@/components/form/EditMetaObjectForm'
import { GlobalDragOverlayInstance, useGlobalIsDragging } from '@/components/globalDragOverlay/GlobalDragOverlay'
import { useGlobalEventEmitter } from '@/events/useEventEmitter'
import { useMemoizedFn } from '@/hooks'
import { undeletedMetaObjectsAtom } from '@/stores/meta.store'
import { globalStore } from '@/stores'
import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import { useAtomValue } from 'jotai/react'
import { memo, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MenuItem } from './Item'

const SidebarDatabase = memo(() => {
  const [newMetaVisible, setNewMetaVisible] = useState(false)
  const [globalIsDragging] = useGlobalIsDragging()
  const itemRef = useRef<HTMLLIElement>(null)
  const emitter = useGlobalEventEmitter()
  const [draggingHovered, setDraggingHovered] = useState({
    droppable: false,
    visible: false
  })
  const navigate = useNavigate()
  const pointerHandler = useMemoizedFn((e: PointerEvent) => {
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
  useEffect(() => {
    if (globalIsDragging) {
      itemRef.current?.addEventListener('pointerenter', pointerHandler)
      itemRef.current?.addEventListener('pointerup', pointerHandler)
      itemRef.current?.addEventListener('pointerleave', pointerHandler)
      return () => {
        itemRef.current?.removeEventListener('pointerenter', pointerHandler)
        itemRef.current?.removeEventListener('pointerup', pointerHandler)
        itemRef.current?.removeEventListener('pointerleave', pointerHandler)
      }
    }
  }, [globalIsDragging])
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
            {draggingHovered.droppable ? 'Drop to add object into database' : "Can't drop this type of object"}
          </div>
        }
      >
        <MenuItem
          onClick={() => navigate('/database')}
          className={css([draggingHovered.visible ? ClassName.Drag.droppableItemHovered(draggingHovered.droppable) : undefined])}
          style={{
            background: draggingHovered.visible ? 'white' : undefined,
            position: 'relative',
            overflow: 'visible'
          }}
        >
          <Icon name="park-data" style={{ marginRight: 10 }} size={16} />
          Database
          <div style={{ marginLeft: 'auto', marginRight: 10, fontSize: 12 }}>{undeletedMetaObjects.length}</div>
          <Icon
            name="park-plus"
            onClick={e => {
              e.stopPropagation()
              setNewMetaVisible(true)
            }}
            className={ClassName.circleButton(2, 4)}
          />
        </MenuItem>
      </AnimatePopover>
    </>
  )
})

export default SidebarDatabase
