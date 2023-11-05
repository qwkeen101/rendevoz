import { MetaGroupProperty } from '~/typings'
import { Reorder, useDragControls } from 'framer-motion'
import { Colors } from '@/consts'
import { Resizable } from 're-resizable'
import { AnimatePopover, Content, Icon } from '@/components'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { useIsIn } from '@/hooks'
import { ClassName } from 'rendevoz'
import ColumnMenu from '@/core/group/components/menu/ColumnMenu'

const GroupHeaderItem = ({
  item,
  onDragEnd,
  onResizeEnd,
  onResize
}: {
  item: MetaGroupProperty
  onDragEnd: VoidFunction
  onResize: (currItem: MetaGroupProperty) => void
  onResizeEnd: (currItem: MetaGroupProperty) => void
}) => {
  const controls = useDragControls()
  const { t } = useTranslation()
  const [isResizing, setIsResizing] = useState(false)
  const { ref, isIn } = useIsIn()
  return (
    <Reorder.Item
      onDragEnd={onDragEnd}
      dragListener={false}
      dragControls={controls}
      as={'div'}
      value={item}
      style={{
        borderRight: `1px solid transparent`,
        color: Colors.Font.Description,
        fontWeight: 600,
        height: '36px',
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        userSelect: 'none'
      }}
    >
      <Resizable
        className={ClassName.flatButton(0)}
        enable={{ right: true }}
        minWidth={90}
        style={{
          padding: '2px 8px',
          transition: 'background 0.2s ease',
        }}
        onResize={(event, direction, elementRef, delta) => {
          const newItem = { ...item, width: elementRef.clientWidth }
          onResize(newItem)
        }}
        onResizeStart={() => {
          setIsResizing(true)
        }}
        onResizeStop={(event, direction, elementRef, delta) => {
          const newItem = { ...item, width: elementRef.clientWidth }
          onResizeEnd(newItem)
          setIsResizing(false)
        }}
        handleStyles={{
          right: {
            right: -3,
            width: 6,
            zIndex: 999
          }
        }}
        handleComponent={{
          right: (
            <div
              ref={ref}
              style={{
                height: '100%',
                transition: 'background 0.2s ease',
                background: isIn || isResizing ? Colors.Common.SelectColor : undefined,
                width: '100%'
              }}
            ></div>
          )
        }}
        defaultSize={{ width: item.width, height: '100%' }}
        size={{ width: item.width, height: '100%' }}
      >
        {/*<AnimatePopover positions={['top']} content={<ColumnMenu />}>*/}
        <Content
          flex
          gap={6}
          onPointerDown={e => {
            controls.start(e)
          }}
          fullHeight
          fullWidth
          alignItems={'center'}
        >
          {item.icon && <Icon name={item.icon} />}
          {t(item.display)}
        </Content>
        {/*</AnimatePopover>*/}
      </Resizable>
    </Reorder.Item>
  )
}

export default GroupHeaderItem
