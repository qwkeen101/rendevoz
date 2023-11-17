import { RefObject, useEffect, useRef, useState } from 'react'
import { Rendevoz } from '@/core/rendevoz'
import { assignProperties } from '@/utils'
import { BuiltInDraggableElement, GlobalDragPointerUpEvent, MetaGroupChild, XYPosition } from '~/typings'
import { createPortal } from 'react-dom'
import { AnimatePopover, Icon, WithBorder } from '@/components'
import { ClassName } from 'rendevoz'
import { useGlobalIsDragging } from '@/core'
import Id from '@/utils/id'
import { Path } from 'slate'
import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
import reorderDragItems from '@/core/components/group/hooks/drag/reorderItems'
import { mousePos } from '@/hooks/utils/useMousePositionRef'
import RowMenu from '@/core/components/group/components/menu/RowMenu'

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

        if (instance.values.selectedRowIdSet.size) {
          Rendevoz.Actions.State.Drag.addDragElements(<div>{instance.values.selectedRowIdSet.size} rows are dragged</div>)
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
          Rendevoz.Actions.State.Drag.addDragElements(node.cloneNode(true) as HTMLElement)
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
        if (dragHandle?.visible) {
          if (details.value === dragHandle?.value) return
          if (box.top === dragHandle?.position?.y) return
        }
        const { left, top, height } = box
        const position = {
          x: left - 24,
          y: top + 15
        }
        setTimeout(() => {
          setDragHandle({ position, value: details.value, node: details.node.cloneNode(true), visible: true })
        },500)
      },
      removeDragHandle: () => {
        if (isInHandleRef.current) return
        if (!dragHandle?.visible) return
        const [x, y] = mousePos.current
        if (document.elementFromPoint(x, y)?.closest('[data-group-item]')) return
        console.log('set here')
        setDragHandle(undefined)
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
    const { draggingElement, event } = data
    const newItem: Partial<MetaGroupChild> = {
      rowId: Id.getId()
    }
    Rendevoz.Events.Emit.GlobalEventEmitter.emitWithCallback('global', {
      type: 'globalDropNeedFurtherProcess',
      data: {
        draggingElement: draggingElement,
        e: event
      }
    }).then(meta => {
      if (meta) {
        if (dragDetailsRef.current) {
          newItem.type = 'metaObject'
          newItem.id = meta.id
          const { value, towards } = dragDetailsRef.current
          reorderDragItems({
            items: [newItem],
            groupId: options.groupId,
            instance,
            insert: true,
            towards: dragDetailsRef.current?.towards,
            targetValue: dragDetailsRef.current?.value
          })
        }
      }
    })
  }

  useEffect(() => {
    emitter.addListener('global', handler)
    return () => {
      emitter.removeListener('global', handler)
    }
  }, [])

  const renderHandle = () =>
    createPortal(
      dragHandle && !globalDragging && (
        <div
          style={{
            position: 'fixed',
            width: '100vw',
            height: '100vh',
            pointerEvents: 'none'
          }}
        >
          <AnimatePopover
            positions={['right']}
            withClickCover={true}
            content={setV => (
              <WithBorder padding={6}>
                <RowMenu details={dragHandle.value} onClose={() => setV(false)} />
              </WithBorder>
            )}
          >
            <div
              style={{
                position: 'absolute',
                transform: `translate(${dragHandle.position?.x ?? 0}px,${dragHandle.position?.y ?? 0}px)`,
                left: 0,
                pointerEvents: 'auto',
                top: 0,
                opacity: dragHandle.visible ? 1 : 0,
                transition: 'all 0.16s ease'
              }}
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
            </div>
          </AnimatePopover>
        </div>
      ),
      document.body
    )

  return {
    renderHandle
  }
}

export default useGroupDrag
