import { Noop } from '@/common/types'
import { Dispatch, ReactNode, SetStateAction, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePopover, WithBorder } from '@/components'
import { GraphEdge } from '../../types/edge'
import EdgeAttributeCard from './EdgeAttributeCard'
import { LeftTopPosition, Size } from '~/typings'
import useGraph from '../../hooks/useGraph'
import { ObjectActionMenu } from '@/core'
import GraphContentDisplayer from '@/core/components/graph/components/overlay/GraphContentDisplayer'

export type GraphOverlayManager = {
  open: VoidFunction
  isOpen: () => boolean
  getState: () => OverlayState
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
  | {
      content?: 'contentDisplayer'
      metaId: number
    }
)
const useGraphOverlay = () => {
  const [overlayState, setOverlayState] = useState<OverlayState>({
    visible: false
  })
  const renderContent = () => {
    switch (overlayState.content) {
      case 'edgeToolbar':
        return <EdgeAttributeCard currentEdge={overlayState.object} />
      case 'contentDisplayer':
        return <GraphContentDisplayer id={overlayState.metaId} />
      case 'nodePopover':
        return (
          <ObjectActionMenu
            visibility={{
              showGraph: true
            }}
            metaObjectId={overlayState.metaId}
            onClose={() => setOverlayState(s => ({ ...s, visible: false }))}
          />
        )
    }
  }

  const graph = useGraph()
  const positions = () => {
    switch (overlayState.content) {
      case 'pathIndicator':
        return ['top', 'bottom']
      case 'nodePopover':
        return ['right', 'left']
      default:
        return ['top', 'bottom']
    }
  }
  const renderPortal = () => {
    return (
      <Portal>
        <AnimatePopover
          align={overlayState.content === 'nodePopover' ? 'start' : 'center'}
          reposition
          keepAlign={true}
          withClickCover={overlayState.content !== 'contentDisplayer'}
          position={{
            left: overlayState.position?.left,
            top: overlayState.position?.top
          }}
          boundaryInset={40}
          positions={positions()}
          visible={!!overlayState.visible}
          onVisiblityChange={v => setOverlayState(s => ({ ...s, visible: v }))}
          content={
            <WithBorder className={'!rounded-lg'} style={{ maxWidth: 400 }}>
              {renderContent()}
            </WithBorder>
          }
          padding={overlayState.content === 'contentDisplayer' ? -2 : 0}
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
      setContent: c => setOverlayState(s => ({ ...s, content: c })),
      isOpen: () => overlayState.visible,
      getState: () => overlayState
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
