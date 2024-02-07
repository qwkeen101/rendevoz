import { IWhiteboardNode } from '~/typings'
import { Icon } from '@/components'
import { Colors } from '@/consts'
import { memo } from 'react'
import { ClassName } from 'rendevoz'
import { useWhiteboardInstance } from '@/core/components/whiteboard/hooks'
import Id from '@/utils/id'

export default memo(({ node }: { node: IWhiteboardNode }) => {
  const instance = useWhiteboardInstance()
  const handleAddSubNode = (direction: 'right' | 'left') => {
    //
    if (node.type === 'mindmap') {
      instance.updateWhiteboard?.(w => {
        const newNodeId = Id.getId()
        const maxZ = instance.nodeOps?.getMaxZindex() ?? 0
        w.nodes?.set(newNodeId, {
          id: newNodeId,
          x: 0,
          y: 0,
          width: 100,
          type: 'text',
          rootId: node.id,
          side: direction,
          z: maxZ,
          content: [{ id: Id.getId(), type: 'paragraph', children: [{ text: '' }] }]
        })
        const origin = w.nodes?.get(node.id)
        if (origin && origin.type === 'mindmap') {
          w.nodes?.set(origin.id, { ...origin, rightChildren: [...(origin.rightChildren || []), { root: newNodeId, children: [] }] })
        }
      })
    } else {
      console.log('ad here')
      instance
        .insertNode?.({
          x: 0,
          y: 0,
          width: 100,
          type: 'text',
          side: direction,
          content: [{ id: Id.getId(), type: 'paragraph', children: [{ text: '' }] }]
        })
        .then(n => {
          if (n.length === 1) {
            Array.from(instance.values.ID_TO_NODE_MAP.values()).forEach(i => {
              i.onAddSubNode?.(node.id, n[0], 0, direction)
            })
          }
        })
    }
  }
  if (node.type === 'mindmap') {
    return (
      <>
        <div
          onClick={() => handleAddSubNode('left')}
          className={'border'}
          data-disable-drag
          style={{
            borderRadius: 999,
            position: 'absolute',
            left: '-35px',
            top: '50%',
            cursor: 'pointer',
            color: Colors.Common.SelectColor,
            backgroundColor: Colors.Background.Global,
            transform: 'translateY(-50%)'
          }}
        >
          <Icon name={'park-plus'} className={ClassName.circleButton(4, 999)} />
        </div>
        <div
          onClick={() => handleAddSubNode('right')}
          className={'border'}
          style={{
            position: 'absolute',
            borderRadius: 999,
            cursor: 'pointer',
            right: '-35px',
            top: '50%',
            color: Colors.Common.SelectColor,
            backgroundColor: Colors.Background.Global,
            transform: 'translateY(-50%)'
          }}
        >
          <Icon name={'park-plus'} className={ClassName.circleButton(4, 999)} />
        </div>
      </>
    )
  }
  if (node.rootId) {
    if (node.side === 'right') {
      return (
        <div
          onPointerDown={() => {
            console.log('cl')
            handleAddSubNode('right')
          }}
          className={'border'}
          style={{
            position: 'absolute',
            borderRadius: 999,
            cursor: 'pointer',
            zIndex: 999,
            right: '-35px',
            top: '50%',
            color: Colors.Common.SelectColor,
            backgroundColor: Colors.Background.Global,
            transform: 'translateY(-50%)'
          }}
        >
          <Icon name={'park-plus'} className={ClassName.circleButton(4, 999)} />
        </div>
      )
    }
  }
  return null
})
