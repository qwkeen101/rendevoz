import { RefObject, useEffect, useRef, useState } from 'react'
import { assignProperties } from '@/utils'
import { IGlobalEvents, MetaGroupChild, XYPosition } from '~/typings'
import { createPortal } from 'react-dom'
import { Icon } from '@/components'
import { ClassName } from 'rendevoz'
import { useGlobalIsDragging } from '@/core'
import Id from '@/utils/id'
import { Path } from 'slate'
import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
import reorderDragItems from '@/core/components/group/hooks/drag/reorderItems'
import { mousePos } from '@/hooks/utils/useMousePositionRef'
import { useSelectAtomValue } from '@/hooks'
import { GroupStateAtom } from '@/core/components/group/hooks/useGroupState'
import { Colors } from '@/consts'
import { useStore } from 'jotai'
import { motion } from 'framer-motion'
const GroupDragHandle = ({ bodyRef, groupId }: { bodyRef: RefObject<HTMLElement>; groupId?: number }) => {
  const [globalDragging] = useGlobalIsDragging()
  const isPressed = useRef(false)
  const store = useStore()
  const canDrag = useSelectAtomValue(GroupStateAtom, s => s.state?.canDrag) ?? true
  const isSelecting = useSelectAtomValue(GroupStateAtom, s => s.isSelecting)
  const isScrolling = useSelectAtomValue(GroupStateAtom, s => s.isScrollingBody)
  const currentView = useSelectAtomValue(GroupStateAtom, s => s.currentView?.type)
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
  const isDraggingRef = useRef(false)

  assignProperties(instance, {
    dragOps: {
      startDrag: details => {
        const { value, node } = details
        if (isDraggingRef.current) return
        isDraggingRef.current = true
        instance.bodyOps?.startDetectAutoScroll?.()
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
          Global.values.draggingDetails = {
            type: 'groupItem',
            groupId: groupId,
            value: Array.from(pathSet.values())
              .map(i => {
                const parse = JSON.parse(i) as Path
                const value = instance.valueOps?.getValueByPath(parse)
                return value
              })
              .filter(i => i) as MetaGroupChild[]
          }
        } else {
          const n = node.cloneNode(true) as HTMLElement
          n.style.height = `${node.clientHeight}px`
          n.style.width = `${node.clientWidth}px`
          n.style.setProperty('--table-columns', `${store.get(GroupStateAtom).headerColumn}`)
          n.style.borderTop = Colors.Consts.Border
          Global.commonOps?.setDraggingElements(n)
          Global.values.draggingDetails = {
            type: 'groupItem',
            groupId: groupId,
            value: [value]
          }
        }

        Global.commonOps?.startDrag()
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
        if (isSelecting) return
        if (!bodyRef.current) return
        if (isScrolling) return
        const containerRect = bodyRef.current.getBoundingClientRect()
        const box = details.node.getBoundingClientRect()
        if (dragHandle?.visible) {
          if (box.top === dragHandle?.position?.y) return
        }
        const scale = box.width / details.node.offsetWidth
        const { left, top, height } = box
        const position = {
          x: (left - containerRect.left) / scale - 24,
          y: (top - containerRect.top) / scale + 15 + bodyRef.current.scrollTop
        }
        setDragHandle({ position, value: details.value, node: details.node, visible: true })
      },
      removeDragHandle: () => {
        if (isInHandleRef.current) return
        if (!dragHandle?.visible) return
        if (isScrolling) return
        console.log('removing')
        const [x, y] = mousePos.current
        if (document.elementFromPoint(x, y)?.closest('[data-group-item]')) return
        setDragHandle(s => ({ ...s, visible: false }))
      }
    }
  })
  const handleDragEnd = (data: IGlobalEvents['dragEnd']) => {
    isPressed.current = false
    isDraggingRef.current = false
    instance.bodyOps?.endDetectAutoScroll?.()
    const target = data.event.target
    const body = bodyRef.current
    if (body) {
      // drop on table, if table row dragging is true, we are reordering items in table
      // or we are dragging new items to add into table
      if (target instanceof HTMLElement && body?.contains(target)) {
        const element = Global.values.draggingDetails
        setDragHandle(undefined)
        console.log(element)
        if (element && element.type === 'groupItem' && element.groupId === groupId) {
          if (element.value.length) {
            if (dragDetailsRef.current) {
              reorderDragItems({
                items: element.value,
                groupId: groupId,
                instance,
                towards: dragDetailsRef.current.towards,
                targetValue: dragDetailsRef.current.value
              })
            }
          }
          return
        } else {
          const canDragInside = instance.getGroupState?.().state?.canDragInside ?? true
          if (canDragInside === false) return
          handleInsertItem(data.event)
        }
      }
    }
  }

  const handleInsertItem = (event: PointerEvent | DragEvent) => {
    if (!groupId) return
    Global.metaOps
      .addDraggableAsMeta(undefined, {
        event
      })
      .then(meta => {
        if (meta.length) {
          instance.on?.({
            type: 'metaDragInside',
            ids: meta.map(i => i.id)
          })
          if (dragDetailsRef.current) {
            reorderDragItems({
              items: meta.map(i => ({ type: 'metaObject', id: i.id, rowId: Id.getId() })),
              groupId: groupId,
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
    Global.addEventListener('dragEnd', handleDragEnd)
    return () => {
      Global.removeEventListener('dragEnd', handleDragEnd)
    }
  })

  if (dragHandle && (currentView === 'table' || currentView === 'list') && !globalDragging && bodyRef.current) {
    return createPortal(
      <motion.div
        initial={{ opacity: 0 }}
        animate={{
          opacity: dragHandle.visible ? 1 : 0
        }}
        style={{
          position: 'absolute',
          transform: `translateY(-50%)`,
          left: dragHandle.position?.x ?? 0,
          pointerEvents: 'auto',
          top: dragHandle.position?.y ?? 0,
          transition: 'none',
          zIndex: 99,
          color: Colors.Font.SuperTransparent
        }}
        onPointerDown={e => {
          if (e.button === 0) {
            isPressed.current = true
          }
        }}
        onPointerUp={() => {
          isPressed.current = false
        }}
        onClick={event => {
          instance.selectOps?.selectItem(dragHandle.value.tempRowId || dragHandle.value.rowId, true)
          instance.overlayOps?.open(
            {
              type: 'itemContextMenu',
              details: dragHandle.value
            },
            {
              x: event.clientX,
              y: event.clientY
            }
          )
        }}
        onPointerMove={e => {
          if (isSelecting) return
          if (!isPressed.current) return
          if (!canDrag) return
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
        <Icon role={'group-drag-handle'} className={ClassName.circleButton(3, 4)} size={18} name={'park-drag'} />
      </motion.div>,
      bodyRef.current
    )
  }
  return null
}

export default GroupDragHandle
