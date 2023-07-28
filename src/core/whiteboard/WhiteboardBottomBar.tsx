import { useWhiteboardState } from '@/core/whiteboard/hooks/useWhiteboardState'
import { Icon, Toolbar, Tooltip } from '@/components'
import { useFlow } from '@/core/whiteboard/hooks'
import { useEffect } from 'react'
import FontSize from '@/consts/font'
import { ClassName } from 'rendevoz'
import { DraggableElement, DraggingElement } from '@/core'
import Id from '@/utils/id'

const WhiteboardBottomBar = () => {
  const [whiteboardState, setWhiteboardState] = useWhiteboardState()
  const flow = useFlow()

  useEffect(() => {
    if (whiteboardState?.dragMode === 'select') {
      flow.selectable = true
    } else {
      flow.selectable = false
    }
  }, [whiteboardState?.dragMode])
  return (
    <Toolbar
      onMouseDown={e => e.preventDefault()}
      style={{
        position: 'absolute',
        bottom: 30,
        left: '50%',
        transform: 'translateX(-50%)',
        borderRadius: 4,
        padding: '4px',
        height: 'fit-content',
        gap: 10
      }}
      itemSize={20}
      itemSpace={10}
      className={ClassName.Background.pseudoBlubBackground}
    >
      <Toolbar.Item
        onClick={() => setWhiteboardState(s => ({ ...s, dragMode: 'select' }))}
        iconName="park-move-one"
        isActive={whiteboardState?.dragMode === 'select'}
      ></Toolbar.Item>
      <Toolbar.Item
        onClick={() => setWhiteboardState(s => ({ ...s, dragMode: 'drag' }))}
        iconName="park-move"
        isActive={whiteboardState?.dragMode === 'drag'}
      ></Toolbar.Item>
      <DraggableElement
        draggingDetails={{
          type: 'whiteboard-text'
        }}
        hoverElement={<DraggingElement text="Drop to add text" />}
      >
        <Tooltip content="Drag To Add text" position="top">
          <Icon className={ClassName.circleButton(undefined, 4)} size={20} name="park-text" />
        </Tooltip>
      </DraggableElement>
      <DraggableElement
        draggingDetails={{
          type: 'note',
          noteId: Id.getId()
        }}
        hoverElement={<DraggingElement text="Drop to add note" />}
      >
        <Tooltip content="Drag To Add Note" position="top">
          <Icon className={ClassName.circleButton(undefined, 4)} size={20} name="park-notes" />
        </Tooltip>
      </DraggableElement>
      <Toolbar.Separator />
      <div style={{ fontWeight: 600, fontSize: FontSize['13px'] }}>{(whiteboardState.zoom * 100).toFixed(0)}%</div>
      <Toolbar.Item
        iconName="park-plus"
        onClick={e => {
          e.preventDefault()
          e.stopPropagation()
          const container = flow.containerEle
          const containerBounding = container?.parentElement?.getBoundingClientRect()
          flow.panzoom?.smoothZoom(containerBounding.width / 2, containerBounding.height / 2, 2)
        }}
      ></Toolbar.Item>
      <Toolbar.Item
        iconName="park-minus"
        onClick={e => {
          e.stopPropagation()
          e.preventDefault()
          const container = flow.containerEle
          const containerBounding = container?.parentElement?.getBoundingClientRect()
          flow.panzoom?.smoothZoom(containerBounding.width / 2, containerBounding.height / 2, 0.5)
        }}
      ></Toolbar.Item>
    </Toolbar>
  )
}

export default WhiteboardBottomBar
