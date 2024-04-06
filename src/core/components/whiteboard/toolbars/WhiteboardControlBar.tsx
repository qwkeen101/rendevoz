import { useWhiteboardState } from '@/core/components/whiteboard/hooks/useWhiteboardState'
import { Content, Icon, Tooltip, WithBorder } from '@/components'
import { Colors } from '@/consts'
import { ClassName } from 'rendevoz'
import FontSize from '@/consts/font'
import { useFlow } from '@/core/components/whiteboard/StateHooks'
import WhiteboardMinimap from '@/core/components/whiteboard/minimap/WhiteboardMinimap'
import { memo, useEffect, useState } from 'react'
import { useWhiteboardInstance } from '@/core/components/whiteboard/hooks'
import { getBoxOfNodes } from '@/core/components/whiteboard/utils'
import TooltipWithCmd from '@/components/TooltipWithCmd'
import { useTranslation } from 'react-i18next'

const WhiteboardControlBar = memo(() => {
  const [whiteboardState, setWhiteboardState] = useWhiteboardState()
  console.log('rerender', whiteboardState)
  const flow = useFlow()
  const [historyState, setHistoryState] = useState({
    redo: false,
    undo: false
  })
  const instance = useWhiteboardInstance()
  useEffect(() => {
    const interval = setInterval(() => {
      setHistoryState(s => {
        const his = flow.history
        const canRedo = !!his.redos.length
        const canUndo = !!his.undos.length
        if (canRedo !== s.redo || canUndo !== s.undo) {
          return {
            redo: canRedo,
            undo: canUndo
          }
        }
        return s
      })
    }, 200)
    return () => {
      clearInterval(interval)
    }
  }, [])
  const transformHistory = instance.values.transformHistory
  const { t } = useTranslation()
  const showUndo = transformHistory.undos.length > 0
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
      {!whiteboardState.readOnly && (
        <>
          {(showUndo || transformHistory.redos.length > 0) && (
            <WithBorder
              borderBoxShadow
              padding={6}
              style={{ background: Colors.Background.Popover, display: 'flex', alignItems: 'center', gap: 8 }}
            >
              {showUndo && (
                <Tooltip content={<TooltipWithCmd cmd={'Shift+E'} name={t('whiteboard.Undo view change')} />}>
                  <Icon
                    className={ClassName.circleButton(6, 6)}
                    name={'park-back-one'}
                    onClick={() => {
                      instance.containerOps?.undoTransform()
                    }}
                  />
                </Tooltip>
              )}
              {transformHistory.redos.length > 0 && (
                <Tooltip content={<TooltipWithCmd cmd={'Shift+Q'} name={'Redo view change'} />}>
                  <Icon
                    className={ClassName.circleButton(6, 6)}
                    name={'park-go-ahead'}
                    onClick={() => {
                      instance.containerOps?.redoTransform()
                    }}
                  />
                </Tooltip>
              )}
            </WithBorder>
          )}
          <WithBorder
            borderBoxShadow
            padding={6}
            style={{ background: Colors.Background.Popover, display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <Tooltip content={<TooltipWithCmd cmd={'Cmd+Z'} name={t('general.Undo')} />}>
              <Icon
                className={ClassName.circleButton(6, 6)}
                name={'park-back'}
                onClick={() => flow.undo?.()}
                style={{
                  color: historyState.undo ? undefined : Colors.Background.Border,
                  cursor: historyState.undo ? undefined : 'not-allowed'
                }}
              />
            </Tooltip>
            <Tooltip content={<TooltipWithCmd cmd={'Cmd+Y'} name={t('general.Redo')} />}>
              <Icon
                className={ClassName.circleButton(6, 6)}
                name={'park-share-two'}
                onClick={() => flow.redo?.()}
                style={{
                  color: historyState.redo ? undefined : Colors.Background.Border,
                  cursor: historyState.redo ? undefined : 'not-allowed'
                }}
              />
            </Tooltip>
          </WithBorder>
        </>
      )}
      <WithBorder
        borderBoxShadow
        padding={6}
        style={{ background: Colors.Background.Popover, display: 'flex', alignItems: 'center', gap: 8 }}
      >
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
            background: whiteboardState.currentTool ? undefined : Colors.Background.ButtonActive,
            pointerEvents: whiteboardState.readOnly ? 'none' : 'auto'
          }}
          className={ClassName.circleButton(6, 6)}
          name={
            whiteboardState.readOnly ||
            whiteboardState.isPanning ||
            whiteboardState.pointerMode === 'pan' ||
            whiteboardState.toolbarPointerMode === 'pan'
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
            if (!containerBounding) return
            flow.panzoom?.smoothZoom(containerBounding.width / 2, containerBounding.height / 2, 0.5)
          }}
          name={'park-minus'}
          className={ClassName.circleButton(6, 6)}
        />
        <div
          onClick={() => {
            const allNodes = instance.getAllNode?.()
            if (allNodes?.length) {
              const box = getBoxOfNodes(allNodes)
              if (box) {
                instance.containerOps?.fitTo(box)
                return
              }
            }
            const bounding = flow.parentContainerEle?.getBoundingClientRect()
            if (bounding) {
              flow.panzoom?.smoothZoomAbs(bounding.width / 2, bounding.height / 2, 1)
            }
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
})

export default WhiteboardControlBar
