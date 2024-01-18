import { Toolbar, WithBorder } from '@/components'
import { Colors } from '@/consts'
import { useWhiteboardState } from '@/core/components/whiteboard/hooks/useWhiteboardState'

const WhiteboardNodesBar = () => {
  const [whiteboardState, setWhiteboardState] = useWhiteboardState()
  return (
    <WithBorder
      padding={6}
      borderBoxShadow
      style={{
        background: Colors.Background.Popover,
        position: 'absolute',
        left: 20,
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 10
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
      </Toolbar>
    </WithBorder>
  )
}

export default WhiteboardNodesBar
