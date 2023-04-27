import ClassName from '@/styles/classNames'
import Id from '@/utils/id'
import { Content, Icon, Tooltip } from '@/components'
import { GlobalDragOverlayInstance } from '@/core'
import { useFlow } from './hooks'
import FontSize from '@/consts/font'

const WhiteboardSetting = () => {
  const flow = useFlow()
  return (
    <Content
      flex
      gap={6}
      style={{
        padding: '4px 12px',
        fontSize: FontSize['18px'],
        borderRadius: 999,
        background: 'rgba(0,0,0,0.08)'
      }}
    >
      <Tooltip content="Select" position="top">
        <Icon
          className={ClassName.circleButton(undefined, 4)}
          onClick={() => {
            flow.selectable = true
          }}
          name="park-move-one"
        />
      </Tooltip>
      <Tooltip content="Move" position="top">
        <Icon
          className={ClassName.circleButton(undefined, 4)}
          onClick={() => {
            flow.selectable = false
          }}
          name="park-hand-drag"
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
      <Tooltip content="Drag To Add Card" position="top">
        <Icon
          onPointerDown={() => {
            GlobalDragOverlayInstance.draggingDetails = {
              type: 'note',
              noteId: Id.getId(),
              isCard: true
            }
            GlobalDragOverlayInstance.addDragElements?.(<DraggingNote />)
            GlobalDragOverlayInstance.startDrag?.()
          }}
          onPointerMove={() => {}}
          className={ClassName.circleButton(undefined, 4)}
          name="park-rectangle-one"
        />
      </Tooltip>
    </Content>
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
      fontSize: FontSize['16px'],
      color: 'rgba(50,59,74)',
      boxShadow: 'rgba(50, 50, 93, 0.25) 0px 30px 60px -12px, rgba(0, 0, 0, 0.3) 0px 18px 36px -18px'
    }}
  >
    Drop to add note...
  </div>
)
export default WhiteboardSetting
