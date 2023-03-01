import ClassName from '@/styles/classNames'
import Id from '@/utils/id'
import { Icon, Tooltip } from '..'
import { GlobalDragOverlayInstance } from '../globalDragOverlay/GlobalDragOverlay'
import { useFlow } from './hooks'

const WhiteboardSetting = () => {
  const flow = useFlow()
  return (
    <div
      className={ClassName.Background.blurBackground}
      style={{
        padding: '4px',
        boxShadow: 'rgba(0, 0, 0, 0.35) 0px 5px 15px',
        fontSize: 18,
        borderRadius: 4,
        display: 'flex',
        flexDirection: 'column',
        gap: 4
      }}
    >
      <Tooltip content="Select" position="top">
        <Icon
          className={ClassName.circleButton(undefined, 4)}
          onClick={() => {
            flow.selectable = true
          }}
          name="park-selected"
        />
      </Tooltip>
      <Tooltip content="Move" position="top">
        <Icon
          className={ClassName.circleButton(undefined, 4)}
          onClick={() => {
            flow.selectable = false
          }}
          name="park-move-one"
        />
      </Tooltip>
      <Tooltip content="Drag To Add Note" position="top">
        <Icon
          onPointerDown={() => {
            GlobalDragOverlayInstance.draggingDetails = {
              type: 'note',
              noteId: Id.getId()
            }
            GlobalDragOverlayInstance.addDragElements?.(<DraggingNote />)
            GlobalDragOverlayInstance.startDrag?.()
          }}
          onPointerMove={() => {}}
          className={ClassName.circleButton(undefined, 4)}
          name="park-notes"
        />
      </Tooltip>
    </div>
  )
}

const DraggingNote = () => (
  <div
    style={{
      background: 'white',
      width: 338,
      height: 100,
      display: 'flex',
      alignItems: 'center',
      padding: 40,
      fontSize: 16,
      color: 'rgba(50,59,74)',
      boxShadow:
        'rgba(50, 50, 93, 0.25) 0px 30px 60px -12px, rgba(0, 0, 0, 0.3) 0px 18px 36px -18px'
    }}
  >
    Drop to add note...
  </div>
)
export default WhiteboardSetting
