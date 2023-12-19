import { INodeInnerState, ISetNodeInnerState, IWhiteboardNode } from '~/typings'
import { useEffect, useState } from 'react'
import { Content, Icon } from '@/components'
import { Colors } from '@/consts'
import { useSelectAtomValue } from '@/hooks'
import { WhiteboardStateAtom } from '@/core/components/whiteboard/hooks/useWhiteboardState'
import { ClassName } from 'rendevoz'
import { useWhiteboardInstance } from '@/core/components/whiteboard/hooks'

function getTextWidth(text: string, font: string) {
  // re-use canvas object for better performance
  const canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement('canvas'))
  const context = canvas.getContext('2d')
  context.font = font
  const metrics = context.measureText(text)
  return metrics.width
}
export default ({
  node,
  onClick,
  onPointerEnter,
  onPointerLeave,
  setNodeState,
  isEditing,
  nodeState
}: {
  node: IWhiteboardNode & { type: 'group' }
  onClick?: VoidFunction
  onPointerEnter: VoidFunction
  onPointerLeave: VoidFunction
  setNodeState: ISetNodeInnerState
  isEditing: boolean
  nodeState: INodeInnerState
}) => {
  const isDraggingNode = useSelectAtomValue(WhiteboardStateAtom, s => s.isDraggingNode)
  const zoomState = useSelectAtomValue(WhiteboardStateAtom, s => s.zoom)
  const rever = 1 / zoomState
  const handleClick = (e: MouseEvent) => {
    onClick?.()
    if (e.detail === 2) {
      setNodeState(s => ({ ...s, isEditingName: true, selected: true, focused: true }))
    }
  }
  const instance = useWhiteboardInstance()
  const v = node.name
  if (!v) {
    if (!nodeState.focused && !nodeState.isEditingName) {
      return null
    }
  }
  return (
    <Content
      flex
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onClick={handleClick}
      position={'absolute'}
      style={{
        transformOrigin: 'top left',
        borderRadius: 6,
        padding: v || isEditing ? '2px 6px' : undefined,
        maxWidth: `${zoomState * 100}%`,
        background: 'var(--darken-node-color)',
        cursor: isDraggingNode ? 'grabbing' : 'pointer',
        top: 0,
        left: 0,
        transform: `translateY(calc(-${rever * 100}% - ${rever * 6}px)) scale(${rever})`,
        pointerEvents: 'auto'
      }}
    >
      {isEditing ? (
        <input
          spellCheck={'false'}
          autoFocus={true}
          onBlur={e => {
            instance.updateNode?.(node.id, obj => ({ ...obj, name: e.target.value }))
            setNodeState(s => ({ ...s, isEditingName: false }))
          }}
          onChange={e => {
            e.currentTarget.style.width = `${getTextWidth(e.currentTarget.value, '15px Inter')}px`
          }}
          style={{ width: getTextWidth(v, '15px Inter'), maxWidth: '100%', minWidth: 1 }}
          defaultValue={v}
          className={ClassName.noStyleInput}
        />
      ) : (
        <Content flex justifyContent={'space-between'} alignItems={'center'} gap={4}>
          {v && <div className={ClassName.ellipsisFont(1)}>{v}</div>}
          {(!v || nodeState.selected || nodeState.focused) && (
            <Icon
              name={'park-more'}
              size={18}
              className={ClassName.flatButton(4, '2px')}
              onClick={e => {
                const bounding = e.currentTarget.getBoundingClientRect()
                const t = instance.coordOps?.transformWindowPositionToPosition({ x: bounding.right, y: bounding.top + bounding.height / 2 })
                instance.toolbarOps?.openNodeToolbar?.(
                  node.id,
                  {
                    x: t.x,
                    y: t.y
                  },
                  'click'
                )
              }}
            />
          )}
        </Content>
      )}
    </Content>
  )
}
