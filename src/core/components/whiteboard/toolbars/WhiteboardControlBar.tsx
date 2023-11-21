import { useWhiteboardState } from '@/core/components/whiteboard/hooks/useWhiteboardState'
import { Button, Content, Icon, IconWithPopover, WithBorder } from '@/components'
import { Colors } from '@/consts'
import { ClassName } from 'rendevoz'
import FontSize from '@/consts/font'
import { useFlow } from '@/core/components/whiteboard/hooks'
import WhiteboardMinimap from '@/core/components/whiteboard/minimap/WhiteboardMinimap'
import { useEffect, useState } from 'react'

const WhiteboardControlBar = () => {
  const [whiteboardState, setWhiteboardState] = useWhiteboardState()
  const flow = useFlow()
  const [historyState, setHistoryState] = useState({
    redo: false,
    undo: false
  })
  useEffect(() => {
    const interval = setInterval(() => {
      setHistoryState(s => ({
        redo: !!flow.history.redos.length,
        undo: !!flow.history.undos.length
      }))
    }, 200)
    return () => {
      clearInterval(interval)
    }
  }, [])
  return (
    <Content
      flex
      gap={10}
      style={{
        zIndex: 10,
        position: 'absolute',
        alignItems: 'center',
        right: 24,
        bottom: 20
      }}
    >
      <WithBorder
        onClick={() => console.log(flow.history)}
        padding={6}
        style={{ background: Colors.Background.Secondary, display: 'flex', alignItems: 'center', gap: 8 }}
      >
        <Icon
          className={ClassName.circleButton(6, 6)}
          name={'park-back'}
          onClick={() => flow.undo?.()}
          style={{ color: historyState.undo ? undefined : Colors.Background.Border, cursor: historyState.undo ? undefined : 'not-allowed' }}
        />
        <Icon
          className={ClassName.circleButton(6, 6)}
          name={'park-share-two'}
          onClick={() => flow.redo?.()}
          style={{ color: historyState.redo ? undefined : Colors.Background.Border, cursor: historyState.redo ? undefined : 'not-allowed' }}
        />
      </WithBorder>
      <WithBorder padding={6} style={{ background: Colors.Background.Secondary, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon
          onClick={() => {
            setWhiteboardState(s => ({
              ...s,
              currentTool: undefined,
              toolbarPointerMode: s.currentTool ? s.toolbarPointerMode : s.toolbarPointerMode === 'pan' ? 'select' : 'pan',
              pointerMode: s.currentTool ? s.pointerMode : s.toolbarPointerMode === 'select' ? 'pan' : 'select'
            }))
          }}
          style={{
            background: whiteboardState.currentTool ? undefined : Colors.Background.ButtonActive
          }}
          className={ClassName.circleButton(6, 6)}
          name={
            whiteboardState.isPanning || whiteboardState.pointerMode === 'pan' || whiteboardState.toolbarPointerMode === 'pan'
              ? 'park-fist'
              : 'park-move-one'
          }
        />
        <div style={{ height: 28, width: 1, background: Colors.Background.Border }}></div>
        <Icon
          onClick={e => {
            e.stopPropagation()
            e.preventDefault()
            const container = flow.containerEle
            const containerBounding = container?.parentElement?.getBoundingClientRect()
            flow.panzoom?.smoothZoom(containerBounding.width / 2, containerBounding.height / 2, 0.5)
          }}
          name={'park-minus'}
          className={ClassName.circleButton(6, 6)}
        />
        <div
          onClick={() => {
            console.log('click here')
            const bounding = flow.parentContainerEle?.getBoundingClientRect()
            flow.panzoom?.smoothZoomAbs(bounding.width / 2, bounding.height / 2, 1)
          }}
          style={{ fontSize: FontSize['12px'], fontWeight: 600, fontFamily: 'Muli', cursor: 'pointer' }}
        >
          {(whiteboardState.zoom * 100).toFixed(0)}%
        </div>
        <Icon
          onClick={e => {
            e.preventDefault()
            e.stopPropagation()
            const container = flow.containerEle
            const containerBounding = container?.parentElement?.getBoundingClientRect()
            flow.panzoom?.smoothZoom(containerBounding.width / 2, containerBounding.height / 2, 2)
          }}
          name={'park-plus'}
          className={ClassName.circleButton(6, 6)}
        />
        <Icon
          name={'park-map-draw'}
          className={ClassName.circleButton(6, 6)}
          onClick={() => setWhiteboardState(s => ({ ...s, openMinimap: !s.openMinimap }))}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 50,
            right: 0,
            opacity: whiteboardState.openMinimap ? 1 : 0,
            pointerEvents: whiteboardState.openMinimap ? 'auto' : 'none',
            transition: 'opacity 0.2s ease'
          }}
        >
          <WhiteboardMinimap />
        </div>
      </WithBorder>
    </Content>
  )
}

export default WhiteboardControlBar
