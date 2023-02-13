import { css } from '@emotion/css'
import { useEffect } from 'react'
import { useFlow, useTreeNodes } from './hooks'
import TreeNode from './Node'

const TreeNodeContainer = () => {
  const treeNodes = useTreeNodes()
  const flow = useFlow()
  useEffect(() => {
    flow?.ID_TO_EDGE_MAP.forEach(i => {
      i.drawPath()
    })
  }, [treeNodes])
  return (
    <div
      className={css({
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 10,
        pointerEvents: 'none'
      })}
      role="data-container"
    >
      {Array.from(treeNodes.values()).map(i => (
        <TreeNode key={i.id} x={i.x} id={i.id} y={i.y} />
      ))}
    </div>
  )
}

export default TreeNodeContainer
