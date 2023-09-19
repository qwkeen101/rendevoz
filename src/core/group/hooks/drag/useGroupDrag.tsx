import { RefObject, useEffect, useRef, useState } from 'react'
import { Rendevoz } from '@/core/rendevoz'
import { useTableInstance } from '@/core/group/hooks/useTableInstance'
import { assignProperties } from '@/utils'
import { Box, BuiltInDraggableElement, GlobalDragPointerMoveEvent, GlobalDragPointerUpEvent, MetaGroupChild, XYPosition } from '~/typings'
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
import { GroupTransforms } from '@/core/group/actions/transforms'
import { useGroupInstance } from '@/core/group/hooks/useGroupInstance'
import reorderDragItems from '@/core/group/hooks/drag/reorderItems'
import UseMousePositionRef, { mousePos } from '@/hooks/utils/useMousePositionRef'

const useGroupDrag = (options: { bodyRef: RefObject<HTMLElement>; groupId: number }) => {
  const emitter = Rendevoz.Events.Emit.GlobalEventEmitter
  const handler = Rendevoz.Events.Emit.useEventHandler('global')
  const [isDragging, setIsDragging] = useState(false)
  const [globalDragging] = useGlobalIsDragging()
  const [dragHandle, setDragHandle] = useState<{
    position: XYPosition
    value: MetaGroupChild
    visible: boolean
    node?: HTMLElement
  }>()
  const dragDetailsRef = useRef<{
    value: MetaGroupChild
    towards: 'top' | 'bottom' | 'inner'
  }>()
  const instance = useGroupInstance()
  const isInHandleRef = useRef(false)

  assignProperties(instance, {
    dragOps: {
      startDrag: details => {
        const { value, node } = details
        setIsDragging(true)
        instance.bodyOps?.startDetectAutoScroll?.()
        Rendevoz.Actions.State.Drag.addDragElements(node.cloneNode(true) as HTMLElement)
        if (instance.values.selectedRowIdSet.size) {
          const selectedPathes = Array.from(instance.values.selectedRowIdSet.values())
            .map(id => instance.pathOps?.getPathById(id))
            .filter(i => i) as Path[]
          const pathSet = new Set([...selectedPathes.map(i => JSON.stringify(i))])
          pathSet.forEach(path => {
            const parsedPath = JSON.parse(path) as Path
            const parent = JSON.stringify(Path.parent(parsedPath))
            if (pathSet.has(parent)) {
              pathSet.delete(path)
            }
          })
          Rendevoz.Actions.State.Drag.setDraggingDetails({
            type: 'groupItem',
            groupId: options.groupId,
            value: Array.from(pathSet.values())
              .map(i => {
                const parse = JSON.parse(i) as Path
                const value = instance.valueOps?.getValueByPath(parse)
                return value
              })
              .filter(i => i) as MetaGroupChild[]
          })
        } else {
          Rendevoz.Actions.State.Drag.setDraggingDetails({
            type: 'groupItem',
            groupId: options.groupId,
            value: [value]
          })
        }

        Rendevoz.Actions.State.Drag.startDrag()
      },
      setCurrentDragDetails: details => {
        if (details === undefined) {
          dragDetailsRef.current = undefined
        } else {
          dragDetailsRef.current = {
            value: details.value,
            towards: details.towards
          }
        }
      },
      setDragHandle: details => {
        if (globalDragging) return
        const box = details.node.getBoundingClientRect()
        if (details.value === dragHandle?.value) return
        if (box.top === dragHandle?.position?.y) return
        const { left, top, height } = box
        const position = {
          x: left - 24,
          y: top + height / 2
        }
        setDragHandle({ position, value: details.value, node: details.node, visible: true })
      },
      removeDragHandle: () => {
        if (isInHandleRef.current) return
        const [x, y] = mousePos.current
        if (document.elementFromPoint(x, y)?.closest('[data-group-item]')) return
        setDragHandle(s => ({ ...s, visible: false }))
      }
    }
  })
  handler.on('globalDragPointerUp', data => {
    setIsDragging(false)
    instance.bodyOps?.endDetectAutoScroll?.()
    const target = data.event.target
    const body = options.bodyRef.current
    if (body) {
      // drop on table, if table row dragging is true, we are reordering items in table
      // or we are dragging new items to add into table
      if (target instanceof HTMLElement && body?.contains(target)) {
        const element = data.draggingElement as BuiltInDraggableElement
        if (element.type === 'groupItem' && element.groupId === options.groupId && element.value.length) {
          console.log(element)
          reorderDragItems({
            items: element.value,
            groupId: options.groupId,
            instance,
            towards: dragDetailsRef.current?.towards,
            targetValue: dragDetailsRef.current?.value
          })
        } else {
          handleInsertItem(data)
        }
      }
    }
  })

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
        const currentRows = instance.tableOps?.getCurrentRows?.()
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

  const renderHandle = () =>
    createPortal(
      <AnimatePresence>
        {dragHandle && !globalDragging && (
          <motion.div
            style={{
              position: 'fixed',
              transform: 'translateY(-50%)'
            }}
            initial={{
              opacity: 0
            }}
            animate={{
              opacity: dragHandle.visible ? 1 : 0,
              left: dragHandle.position.x,
              top: dragHandle.position.y
            }}
            exit={{ opacity: 0 }}
            onPointerDown={() => {
              if (dragHandle.value) {
                instance.dragOps?.startDrag?.({
                  value: dragHandle.value,
                  node: dragHandle.node
                })
              }
            }}
            onPointerEnter={event => {
              isInHandleRef.current = true
            }}
            onPointerLeave={() => {
              isInHandleRef.current = false
              instance.dragOps?.removeDragHandle?.()
            }}
          >
            <Icon className={ClassName.circleButton(3, 4)} name={'park-drag'} />
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
    )

  return {
    renderHandle
  }
}

export default useGroupDrag
