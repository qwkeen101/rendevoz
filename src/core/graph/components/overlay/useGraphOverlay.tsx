import { Noop } from '@/common/types'
import { Dispatch, ReactNode, SetStateAction, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePopover, WithBorder } from '@/components'
import { GraphEdge } from '../../types/edge'
import EdgeAttributeCard from './EdgeAttributeCard'
import NodePopover from './NodePopover'
import { LeftTopPosition, Size } from '~/typings'
import { Zindexes } from '@/consts'
import PathIndicator from './PathIndicator'
import useGraph from '../../hooks/useGraph'

interface GraphOverlayProps {
  onAddLink: Noop
  onDeleteNode: Noop
  onShowMore: Noop
}
export type GraphOverlayManager = {
  open: VoidFunction
  setContent: (content: OverlayState['content']) => void
  setPosition: (position: LeftTopPosition) => void
  setSize: (size: Size) => void
  setOverlayState: Dispatch<SetStateAction<OverlayState>>
  close: VoidFunction
}
type OverlayState = {
  visible?: boolean
  position?: LeftTopPosition
  size?: Size
} & (
  | {
      content?: 'edgeToolbar'
      object?: GraphEdge
    }
  | { content?: 'nodePopover'; nodeId: number; metaId: number }
  | {
      content?: 'pathIndicator'
    }
)
const useGraphOverlay = () => {
  const [overlayState, setOverlayState] = useState<OverlayState>({
    visible: false
  })
  const [enableTransition, setEnableTransition] = useState(false)
  const renderContent = () => {
    switch (overlayState.content) {
      case 'edgeToolbar':
        return <EdgeAttributeCard currentEdge={overlayState.object} />
      case 'nodePopover':
        return (
          <NodePopover
            metaId={overlayState.metaId}
            nodeId={overlayState.nodeId}
            onClose={() => {
              setOverlayState(s => ({ ...s, visible: false }))
            }}
          />
        )
      case 'pathIndicator':
        return <PathIndicator />
    }
  }
  useEffect(() => {
    if (!overlayState.visible) {
      setEnableTransition(false)
    } else {
      setTimeout(() => setEnableTransition(true), 300)
    }
  }, [overlayState.position, overlayState.visible])

  const graph = useGraph()
  const positions = () => {
    switch (overlayState.content) {
      case 'pathIndicator':
        return ['top', 'bottom']
      case 'nodePopover':
        return ['top', 'right', 'left']
      default:
        return ['top', 'bottom']
    }
  }
  const renderPortal = () => {
    return (
      <Portal>
        <AnimatePopover
          align="center"
          disableIntersection
          reposition
          containerStyle={{
            zIndex: String(Zindexes.GraphPopup)
          }}
          position={{
            left: overlayState.position?.left,
            top: overlayState.position?.top
          }}
          positions={positions()}
          visible={!!overlayState.visible}
          content={<WithBorder style={{ maxWidth: 400, padding: '2px 6px' }}>{renderContent()}</WithBorder>}
          onClickOutside={e => {
            if (graph?.currentClickNodeId) return
            if (graph?.currentClickEdgeId) return
            setTimeout(() => {
              if (!e.defaultPrevented) {
                setOverlayState({ ...overlayState, visible: false })
              }
            }, 50)
          }}
        ></AnimatePopover>
      </Portal>
    )
  }

  const graphOverlayManager: GraphOverlayManager = useMemo(
    () => ({
      open: () => setOverlayState(s => ({ ...s, visible: true })),
      setOverlayState,
      setPosition: p => setOverlayState(s => ({ ...s, position: p })),
      close: () => setOverlayState(s => ({ ...s, visible: false })),
      setContent: c => setOverlayState(s => ({ ...s, content: c }))
    }),
    [overlayState, setOverlayState]
  )
  return {
    graphOverlayManager,
    renderPortal
  }
}

const Portal = ({ children }: { children: ReactNode }) => {
  return createPortal(
    <div
      role="graph-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        pointerEvents: 'none'
      }}
    >
      {children}
    </div>,
    document.body
  )
}
export default useGraphOverlay
