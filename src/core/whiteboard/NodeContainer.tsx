import { css } from '@emotion/css'
import { useEffect } from 'react'
import { useFlow, useWhiteboardNodes } from './hooks'
import WrapperNode from './node/WrapperNode'

const TreeNodeContainer = () => {
  const treeNodes = useWhiteboardNodes()
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
      {Array.from(treeNodes.values()).map(i => (i.id ? <WrapperNode key={i.id} node={i} /> : null))}
    </div>
  )
}

export default TreeNodeContainer
