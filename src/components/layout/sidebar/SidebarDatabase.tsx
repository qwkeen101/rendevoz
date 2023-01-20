import { AnimatePopover, Icon } from '@/components'
import Modal from '@/components/base/modal'
import EditMetaObjectForm from '@/components/form/EditMetaObjectForm'
import { GlobalDragOverlayInstance, useGlobalIsDragging } from '@/components/GlobalDragOverlay'
import useEventEmitter from '@/events/useEventEmitter'
import { useMemoizedFn } from '@/hooks'
import { GlobalScope } from '@/jotai/jotaiScope'
import useMetaStore, { undeletedMetaObjectsAtom } from '@/stores/meta.store'
import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import { useAtomValue } from 'jotai'
import { memo, useEffect, useRef, useState } from 'react'
import { MetaObject } from '~/typings/data'
import { MenuItem } from './Item'

const SidebarDatabase = memo(() => {
  const [newMetaVisible, setNewMetaVisible] = useState(false)
  const [globalIsDragging] = useGlobalIsDragging()
  const [tempMetaObject, setTempMetaObject] = useState<Partial<MetaObject>>()
  const itemRef = useRef<HTMLLIElement>(null)
  const emitter = useEventEmitter()
  const [draggingHovered, setDraggingHovered] = useState({
    droppable: false,
    visible: false
  })
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
          type: 'dragDrop',
          data: {
            dragElement: draggingEle,
            dropOn: 'database'
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
  const { addMetaObject } = useMetaStore()
  const undeletedMetaObjects = useAtomValue(undeletedMetaObjectsAtom, GlobalScope)

  return (
    <>
      <Modal visible={newMetaVisible} onClose={() => setNewMetaVisible(false)} width={300}>
        <EditMetaObjectForm
          metaObject={tempMetaObject}
          title="Create meta object"
          onUpdate={newMeta => {
            newMeta.type = 'normal'
            addMetaObject(newMeta)
            setNewMetaVisible(false)
          }}
        />
      </Modal>
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
          to="/database"
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
            containerClassName={css([ClassName.circleButton(2, 4)])}
          />
        </MenuItem>
      </AnimatePopover>
    </>
  )
})

export default SidebarDatabase
