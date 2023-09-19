import { MetaTableHeader } from '~/typings'
import { Reorder, useDragControls } from 'framer-motion'
import { Colors } from '@/consts'
import { Resizable } from 're-resizable'
import { Content, Icon } from '@/components'

const GroupHeaderItem = ({
  item,
  onDragEnd,
  onResizeEnd
}: {
  item: MetaTableHeader
  onDragEnd: VoidFunction
  onResizeEnd: (currItem: MetaTableHeader) => void
}) => {
  const controls = useDragControls()
  return (
    <Reorder.Item
      onDragEnd={onDragEnd}
      dragListener={false}
      dragControls={controls}
      as={'div'}
      value={item}
      style={{
        borderRight: `1px solid ${Colors.Background.Border}`,
        color: Colors.Font.Description,
        fontWeight: 600,
        height: '100%',
        display: 'flex',
        alignItems: 'center'
      }}
    >
      <Resizable
        enable={{ right: true }}
        style={{
          padding: '2px 8px'
        }}
        onResize={(event, direction, elementRef, delta) => {
          const newItem = { ...item, width: elementRef.clientWidth }
          onResizeEnd(newItem)
        }}
        defaultSize={{ width: item.width, height: '100%' }}
        size={{ width: item.width, height: '100%' }}
      >
        <Content
          flex
          gap={6}
          onPointerDown={e => {
            controls.start(e)
          }}
        >
          {item.icon && <Icon name={item.icon} />}
          {item.display()}
        </Content>
      </Resizable>
    </Reorder.Item>
  )
}

export default GroupHeaderItem
