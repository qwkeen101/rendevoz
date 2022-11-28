import { Noop } from '@/common/types'
import { GraphEventHandler } from '@/events/graphEvent'
import useEventEmitter from '@/events/useEventEmitter'
import { useMemoizedFn } from '@/hooks'
import { FC, ReactNode, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePopover, Content, WithBorder } from '../base'

interface GraphOverlayProps {
  onAddLink: Noop
  onDeleteNode: Noop
}
const GraphOverlay: FC<GraphOverlayProps> = ({ onAddLink, onDeleteNode }) => {
  const emitter = useEventEmitter()
  const [contextMenuDetails, setContextMenuDetails] = useState<{
    x?: number
    y?: number
    type?: string
    visible: boolean
  }>({
    visible: false
  })
  useEffect(() => {
    emitter.addListener('graph', handler)
    return () => {
      emitter.removeListener('graph', handler)
    }
  }, [])
  const handler = new GraphEventHandler()
  handler.on('toggleContextMenu', data => {
    console.log(data)
    setContextMenuDetails({
      x: data.clientX,
      y: data.clientY,
      type: data.componentType,
      visible: true
    })
  })
  const renderContextMenu = () => {
    if (contextMenuDetails.type === 'node') {
      return (
        <Content flex column>
          <div
            onClick={() => {
              onAddLink?.()
              setContextMenuDetails({
                ...contextMenuDetails,
                visible: false
              })
            }}
          >
            Add Link
          </div>
          <div
            onClick={() => {
              onDeleteNode?.()
              setContextMenuDetails({
                ...contextMenuDetails,
                visible: false
              })
            }}
          >
            Delete node
          </div>
          <div>123213213213213</div>
        </Content>
      )
    }
    if (contextMenuDetails.type === 'edge') {
      return (
        <Content flex column>
          <div>Delete edge</div>
        </Content>
      )
    }
    return <div></div>
  }

  return (
    <Portal>
      <AnimatePopover
        positions={['right']}
        align="start"
        padding={10}
        onClickOutside={() => setContextMenuDetails({ ...contextMenuDetails, visible: false })}
        visible={contextMenuDetails.visible}
        content={<WithBorder style={{ pointerEvents: 'auto' }}>{renderContextMenu()}</WithBorder>}
      >
        <div style={{ left: contextMenuDetails.x, top: contextMenuDetails.y, position: 'absolute' }}></div>
      </AnimatePopover>
    </Portal>
  )
}
const Portal = ({ children }: { children: ReactNode }) => {
  return createPortal(
    <div role="graph-overlay" style={{ position: 'fixed', inset: 0, zIndex: 1000, pointerEvents: 'none' }}>
      {children}
    </div>,
    document.body
  )
}
export default GraphOverlay
