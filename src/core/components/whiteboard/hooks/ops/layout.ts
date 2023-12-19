import { IWhiteboardInstance, IWhiteboardNode } from '~/typings'
import { assignProperties } from '@/utils'
import useUpdateWhiteboard from '@/core/components/whiteboard/hooks/useUpdateWhiteboard'
import alignNode from '@/core/components/whiteboard/utils/align/alignNode'
import horizontalSpacing from '@/core/components/whiteboard/utils/align/horizontalSpacing'
import verticalSpacing from '@/core/components/whiteboard/utils/align/verticalSpacing'
import { getBoxOfNodes } from '@/core/components/whiteboard/utils'
import packBoxes from '@/core/components/whiteboard/utils/align/pack'

const assignLayoutOps = (instance: IWhiteboardInstance) => {
  const updateWhiteboard = useUpdateWhiteboard()
  const handleFit = (nodes: IWhiteboardNode[]) => {
    // const box = getBoxOfNodes(nodes)
    // if (box) {
    //   instance.containerOps?.fitTo(box)
    //
    // }
    setTimeout(() => {
      instance.selectOps?.resetSelectionBox()
    })
  }
  assignProperties(instance, {
    layoutOps: {
      alignNodes: (nodes, alignment) => {
        const updated = alignNode(alignment, nodes)
        updateWhiteboard(w => {
          updated.forEach(n => {
            w.nodes?.set(n.id, n)
          })
        }, true)
        setTimeout(() => {
          instance.selectOps?.resetSelectionBox()
        })
      },
      layoutNodes: (nodes, layout, spacing) => {
        switch (layout) {
          case 'horizontallySpacing': {
            const after = horizontalSpacing(nodes, spacing)
            updateWhiteboard(w => {
              after.forEach(n => {
                w.nodes?.set(n.id, n)
              })
            }, true)
            handleFit(after)
            break
          }
          case 'verticallySpacing': {
            const after = verticalSpacing(nodes, spacing)
            updateWhiteboard(w => {
              after.forEach(n => {
                w.nodes?.set(n.id, n)
              })
            }, true)
            handleFit(after)
            break
          }
        }
      },
      packNodes: (nodes, spacing = 30) => {
        const currentBox = getBoxOfNodes(nodes)
        if (!currentBox) return
        const boxesWithIds = nodes
          .filter(i => i.width && i.height)
          .map(i => ({ id: i.id, width: i.width + spacing, height: i.height + spacing }))
        packBoxes(boxesWithIds)
        const finalBoxes = boxesWithIds.map(i => ({ ...i, x: i.left + currentBox.left, y: i.top + currentBox.top }))
        instance.updateWhiteboard?.(w => {
          boxesWithIds.forEach(b => {
            const id = b.id
            const node = w.nodes?.get(id)
            if (node) {
              w.nodes?.set(id, { ...node, x: b.left + currentBox.left, y: b.top + currentBox.top })
            }
          })
        }, true)
        handleFit(finalBoxes)
      }
    }
  })
}
export default assignLayoutOps
