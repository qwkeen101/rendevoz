import ClassName from '@/styles/classNames'
import Id from '@/utils/id'
import { Content, Icon, Tooltip } from '@/components'
import { DraggableElement, DraggingElement } from '@/core'
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
      <DraggableElement
        draggingDetails={{
          type: 'note',
          noteId: Id.getId()
        }}
        hoverElement={<DraggingElement text="Drop to add note" />}
      >
        <Tooltip content="Drag To Add Note" position="top">
          <Icon className={ClassName.circleButton(undefined, 4)} name="park-notes" />
        </Tooltip>
      </DraggableElement>
      {/* <DraggableElement
        draggingDetails={{
          type: 'note',
          noteId: Id.getId(),
          isCard: true
        }}
        hoverElement={<DraggingElement text="Drop to add card" />}
      >
        <Tooltip content="Drag To Add Card" position="top">
          <Icon className={ClassName.circleButton(undefined, 4)} name="park-rectangle-one" />
        </Tooltip>
      </DraggableElement> */}
    </Content>
  )
}

export default WhiteboardSetting
