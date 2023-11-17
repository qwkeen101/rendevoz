import { Icon, Toolbar, Tooltip, WithBorder } from '@/components'
import { Colors } from '@/consts'
import { ClassName } from 'rendevoz'
import { DraggableElement, DraggingElement } from '@/core'
import Id from '@/utils/id'
import { useWhiteboardState } from '@/core/components/whiteboard/hooks/useWhiteboardState'
import { useFlow } from '@/core/components/whiteboard/hooks'

const WhiteboardNodesBar = () => {
  const [whiteboardState, setWhiteboardState] = useWhiteboardState()
  const flow = useFlow()
  return (
    <WithBorder
      padding={6}
      style={{
        background: Colors.Background.Secondary,
        position: 'absolute',
        left: 20,
        top: '50%',
        transform: 'translateY(-50%)'
      }}
    >
      <Toolbar disableDefaultStyle={true} direction={'vertical'} itemSize={20} itemSpace={10}>
        <Toolbar.Item
          onClick={() =>
            setWhiteboardState(s => ({
              ...s,
              currentTool: s.currentTool === 'freehand' ? undefined : 'freehand',
              pointerMode: s.currentTool === 'freehand' ? s.pointerMode : 'select',
              toolbarPointerMode: s.currentTool === 'freehand' ? s.toolbarPointerMode : 'select'
            }))
          }
          iconName="park-pencil"
          isActive={whiteboardState?.currentTool === 'freehand'}
        />
        <Toolbar.Item
          onClick={() =>
            setWhiteboardState(s => ({
              ...s,
              currentTool: s.currentTool === 'erase' ? undefined : 'erase',
              pointerMode: s.currentTool === 'erase' ? s.pointerMode : 'select',
              toolbarPointerMode: s.currentTool === 'erase' ? s.toolbarPointerMode : 'select'
            }))
          }
          iconName="custom-eraser"
          isActive={whiteboardState?.currentTool === 'erase'}
        />
        <DraggableElement
          draggingDetails={{
            type: 'whiteboard-text'
          }}
          shouldPress={0}
          hoverElement={<DraggingElement text="Drop to add text" />}
        >
          <Tooltip content="Drag To Add text" position="top">
            <Icon className={ClassName.circleButton(undefined, 4)} size={20} name="park-text" />
          </Tooltip>
        </DraggableElement>
        <DraggableElement
          shouldPress={0}
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
      </Toolbar>
    </WithBorder>
  )
}

export default WhiteboardNodesBar
