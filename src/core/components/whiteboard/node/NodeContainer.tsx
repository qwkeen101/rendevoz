import { css } from '@emotion/css'
import { useWhiteboardNodes } from '../StateHooks'
import WrapperNode from './WrapperNode'
import TreeEdgeContainer from '@/core/components/whiteboard/edge/EdgeContainer'

const TreeNodeContainer = () => {
  const treeNodes = useWhiteboardNodes()

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
      <TreeEdgeContainer />
      {Array.from(treeNodes.values()).map(i => (i.id ? <WrapperNode key={i.id} node={i} /> : null))}
    </div>
  )
}

export default TreeNodeContainer
