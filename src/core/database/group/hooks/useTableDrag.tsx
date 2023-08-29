import { RefObject, useEffect, useRef, useState } from 'react'
import { Rendevoz } from '@/core/rendevoz'
import { useTableInstance } from '@/core/database/group/hooks/useTableInstance'
import { assignProperties } from '@/utils'
import { Box, GlobalDragPointerMoveEvent, GlobalDragPointerUpEvent, MetaGroupChild, XYPosition } from '~/typings'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Icon } from '@/components'
import { ClassName } from 'rendevoz'
import { useGlobalIsDragging } from '@/core'
import { useDragScroll } from '@/hooks'
import produce from 'immer'
import { ObjectStore } from '@/stores'
import Id from '@/utils/id'
import { Path } from 'slate'
import { GroupTransforms } from '@/core/database/group/actions/transforms'

const useTableDrag = (options: { tableContainerRef: RefObject<HTMLElement>; groupId: number }) => {
  const emitter = Rendevoz.Events.Emit.GlobalEventEmitter
  const handler = Rendevoz.Events.Emit.useEventHandler('global')
  const [isTableRowDragging, setIsTableRowDragging] = useState(false)
  const [globalDragging] = useGlobalIsDragging()
  const [tableHandle, setTableHandle] = useState<{
    position: XYPosition
    metaId: number
    path: number[]
    rowBox: Box
    rowNode: HTMLElement
  }>()
  const dragDetailsRef = useRef<{
    metaId: number
    path: number[]
    position: 'top' | 'bottom' | 'inner'
  }>()
  const instance = useTableInstance()
  const isInHandleRef = useRef(false)
  const previousHandleRef = useRef(tableHandle)
  const { startScroll, endScroll } = useDragScroll(options.tableContainerRef, {
    onScroll: ymovement => {
      instance.scrollTable?.({ y: -ymovement })
    }
  })
  assignProperties(instance, {
    startDrag: (metaId, rowNode) => {
      setIsTableRowDragging(true)
      startScroll()
      Rendevoz.Actions.State.Drag.addDragElements(rowNode.cloneNode(true))
      Rendevoz.Actions.State.Drag.setDraggingDetails({ type: 'metaElement', metaId })
      Rendevoz.Actions.State.Drag.startDrag()
      console.log(rowNode)
    },
    setCurrentDragDetails: details => {
      if (details === undefined) {
        dragDetailsRef.current = undefined
      } else {
        dragDetailsRef.current = {
          metaId: details.rowMetaId,
          path: details.path,
          position: details.position
        }
      }
    },
    setDragHandle: details => {
      if (globalDragging) return
      const box = details.node.getBoundingClientRect()
      if (box.top === tableHandle?.position?.y) return
      const { left, top, height } = box
      const position = {
        x: left - 24,
        y: top + height / 2
      }
      setTableHandle({ position, path: details.path, metaId: details.element.id, rowBox: box, rowNode: details.node })
    },
    removeDragHandle: path => {
      if (globalDragging) return
      if (isInHandleRef.current) return
      if (tableHandle?.path && Path.equals(tableHandle.path, path)) return
      setTableHandle(undefined)
    }
  })
  handler.on('globalDragPointerUp', data => {
    setIsTableRowDragging(false)
    endScroll()
    if (!options.tableContainerRef) return
    const container = options.tableContainerRef.current
    const target = data.event.target
    // drop on table, if table row dragging is true, we are reordering items in table
    // or we are dragging new items to add into table

    if (target instanceof HTMLElement && container?.contains(target)) {
      if (tableHandle) {
        handleReorderItems()
      } else {
        handleInsertItem(data)
      }
    }
  })

  const handleReorderItems = () => {
    if (!tableHandle || !dragDetailsRef.current) return
    const draggingPath = tableHandle.path
    const { path, position, metaId } = dragDetailsRef.current
    const currentRows = instance.getCurrentRows?.()
    if (!currentRows?.length) return
    if (Path.equals(path, draggingPath)) return
    const newRows = GroupTransforms.swapTwoElements(currentRows, draggingPath, path, position)
    ObjectStore('group').updateOne({ id: 1, value: newRows })
  }

  const handleInsertItem = (data: GlobalDragPointerUpEvent) => {
    const { draggingElement } = data
    const newItem: Partial<MetaGroupChild> = {
      rowId: Id.getId()
    }
    if (draggingElement?.type === 'metaElement') {
      if (dragDetailsRef.current) {
        newItem.type = 'metaObject'
        newItem.id = draggingElement.metaId
        const { rowIndex, position } = dragDetailsRef.current
        const currentRows = instance.getCurrentRows?.()
        if (!currentRows?.length) return
        if (currentRows.some(i => i === draggingElement.metaId)) return
        const newRows = produce(currentRows, draft => {
          if (position === 'top') {
            draft.splice(rowIndex, 0, draggingElement.metaId)
          } else {
            draft.splice(rowIndex + 1, 0, draggingElement.metaId)
          }
        })
        ObjectStore('group').updateOne({ id: 1, childrenMetaIds: newRows })
      }
    }
  }

  useEffect(() => {
    emitter.addListener('global', handler)
    return () => {
      emitter.removeListener('global', handler)
    }
  }, [])

  const renderTableHandle = () =>
    createPortal(
      <AnimatePresence>
        {tableHandle && !globalDragging && (
          <motion.div
            style={{
              left: tableHandle.position.x,
              top: tableHandle.position.y,
              position: 'fixed',
              transform: 'translateY(-50%)'
            }}
            initial={{
              opacity: 0
            }}
            animate={{
              opacity: 1
            }}
            exit={{ opacity: 0 }}
            onPointerDown={() => {
              instance.startDrag?.(tableHandle.metaId, tableHandle.rowNode)
              instance.setDragHandle?.(tableHandle.rowBox, tableHandle.index, tableHandle.metaId, tableHandle.rowNode)
            }}
            onPointerEnter={event => {
              isInHandleRef.current = true
            }}
            onPointerLeave={() => {
              isInHandleRef.current = false
              instance.removeDragHandle?.(tableHandle.index)
            }}
          >
            <Icon className={ClassName.circleButton(3, 4)} name={'park-drag'} />
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
    )

  return {
    renderTableHandle
  }
}

export default useTableDrag
