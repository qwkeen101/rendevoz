// 监听全局变化, 每次resize都会触发
import { useRef } from 'react'
import { IWhiteboardMindmap, IWhiteboardNode } from '~/typings'
import autoArrangeLayout from '@/core/components/whiteboard/node/mindmap/autoArrangeLayout'
import { useWhiteboardInstance } from '@/core/components/whiteboard/hooks'
import { useMemoizedFn } from '@/hooks'

const loop = (nodes: IWhiteboardMindmap[], onLoop: (n: IWhiteboardMindmap) => void) => {
  nodes.forEach(n => {
    onLoop(n)
    if (n.children) {
      loop(n.children, onLoop)
    }
  })
}
export default (
  node: IWhiteboardNode & { type: 'mindmap' },
  opts: {
    drawEdges: VoidFunction
    getEdges: (ids: Set<number>) => void
  }
) => {
  // 记录前面一次
  const allSubNodeIds = useRef<{
    right: Set<number>
    left: Set<number>
  }>({
    right: new Set<number>(),
    left: new Set<number>()
  })
  const instance = useWhiteboardInstance()
  const layoutCache = useRef<Record<number, { x: number; y: number }>>({})
  const handleRightTreeChange = useMemoizedFn((rightTree: IWhiteboardMindmap[]) => {
    loop(rightTree, n => allSubNodeIds.current.right.add(n.root))
    const layout = autoArrangeLayout(node, instance, 'right')
    if (layout) {
      const updateQueue: { id: number; x: number; y: number }[] = []
      layout.forEach(n => {
        if (n.id === node.id) return
        const target = instance.getNode?.(n.id)
        if (!target) return
        if (target.width === undefined || target.height === undefined) return
        if (n.x === null || n.y === null) return
        layoutCache.current[n.id] = n
        const box = instance.getNode?.(n.id)
        if (box) {
          const propBox = {
            x: node.x + n.x,
            y: node.y + node.height / 2 + n.y - box.height / 2
          }
          if (box.x !== propBox.x || box.y !== propBox.y) {
            updateQueue.push({
              id: n.id,
              x: propBox.x,
              y: propBox.y
            })
          }
        }
      })
      if (updateQueue.length) {
        instance.updateWhiteboard?.(w => {
          updateQueue.forEach(q => {
            const origin = w.nodes?.get(q.id)
            if (origin) {
              w.nodes?.set(origin.id, {
                ...origin,
                x: q.x,
                y: q.y
              })
            }
          })
        })
      }

      setTimeout(() => {
        opts.getEdges(new Set(Object.keys(layoutCache.current).map(i => Number(i))))
        opts.drawEdges()
      })
    }
  })

  const handleLeftTreeChange = (leftTree: IWhiteboardMindmap[]) => {
    loop(leftTree, n => allSubNodeIds.current.left.add(n.root))
    const layout = autoArrangeLayout(node, instance, 'left')
    if (layout) {
      layoutCache.current = { ...layoutCache.current, ...Object.fromEntries(layout.map(i => [i.id, i])) }
    }
  }
  const handleNodeSizeChange = (n: IWhiteboardNode) => {
    const subIds = allSubNodeIds.current
    if (n.rootId === node.id && (subIds.left.has(n.id) || subIds.right.has(n.id))) {
      if (subIds.right.has(n.id)) {
        handleRightTreeChange(node.rightChildren!)
      }
      if (subIds.left.has(n.id)) {
      }
    }
  }

  const nodeFuncs = instance.values.ID_TO_NODE_MAP.get(node.id)
  if (nodeFuncs) {
    nodeFuncs.onSomeNodeSizeChange = handleNodeSizeChange
  }
  return {
    handleRightTreeChange,
    handleLeftTreeChange,
    layoutCache,
    allSubNodeIds
  }
}
