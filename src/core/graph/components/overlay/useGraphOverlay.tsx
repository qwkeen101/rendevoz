import { Noop } from '@/common/types'
import { Position } from '@/types'
import { Dispatch, ReactNode, SetStateAction, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePopover, WithBorder } from '@/components'
import { GraphEdge } from '../../types/edge'
import EdgeAttributeCard from './EdgeAttributeCard'
import NodePopover from './NodePopover'
import { LeftTopPosition } from '~/typings'

interface GraphOverlayProps {
  onAddLink: Noop
  onDeleteNode: Noop
  onShowMore: Noop
}
export type GraphOverlayManager = {
  open: VoidFunction
  setContent: (content: 'edgeToolbar') => void
  setPosition: (position: LeftTopPosition) => void
  setOverlayState: Dispatch<SetStateAction<OverlayState>>
  close: VoidFunction
}
type OverlayState = {
  visible?: boolean
  position?: LeftTopPosition
} & (
  | {
      content?: 'edgeToolbar'
      object?: GraphEdge
    }
  | { content?: 'nodePopover'; nodeId: number; metaId: number }
)
const useGraphOverlay = () => {
  const [overlayState, setOverlayState] = useState<OverlayState>({
    visible: false
  })
  const renderContent = () => {
    switch (overlayState.content) {
      case 'edgeToolbar':
        return <EdgeAttributeCard currentEdge={overlayState.object} />
      case 'nodePopover':
        return <NodePopover metaId={overlayState.metaId} />
    }
  }
  const renderPortal = () => {
    return (
      <Portal>
        <AnimatePopover
          align="center"
          containerStyle={{ zIndex: '999999' }}
          visible={!!overlayState.visible}
          content={
            <WithBorder padding="6px" style={{ maxWidth: 400 }}>
              {renderContent()}
            </WithBorder>
          }
          onClickOutside={e => {
            setTimeout(() => {
              if (!e.defaultPrevented) {
                setOverlayState({ ...overlayState, visible: false })
              }
            }, 50)
          }}
        >
          <div style={{ position: 'absolute', left: overlayState.position?.left, top: overlayState.position?.top }}></div>
        </AnimatePopover>
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
    <div role="graph-overlay" style={{ position: 'fixed', inset: 0, zIndex: 1000, pointerEvents: 'none' }}>
      {children}
    </div>,
    document.body
  )
}
export default useGraphOverlay
