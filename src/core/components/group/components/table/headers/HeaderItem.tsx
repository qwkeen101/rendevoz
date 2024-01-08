import { MetaGroupProperty } from '~/typings'
import { Reorder, useDragControls } from 'framer-motion'
import { Colors } from '@/consts'
import { Resizable } from 're-resizable'
import { AnimatePopover, Content, Icon } from '@/components'
import { useTranslation } from 'react-i18next'
import { useRef, useState } from 'react'
import { useIsIn } from '@/hooks'
import { ClassName } from 'rendevoz'
import ColumnMenu from '@/core/object/renderer/properties/PropertyMenu'
import { ObjectStore } from '@/api/stores'
import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'

const GroupHeaderItem = ({
  item,
  onDragEnd,
  onResizeEnd,
  onResize
}: {
  item: MetaGroupProperty
  onDragEnd: VoidFunction
  onResize: (currItem: MetaGroupProperty & { width: number }) => void
  onResizeEnd: (currItem: MetaGroupProperty & { width: number }) => void
}) => {
  const controls = useDragControls()
  const { t } = useTranslation()
  const [isResizing, setIsResizing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const { ref, isIn } = useIsIn()
  const instance = useGroupInstance()
  const prop = ObjectStore('metaProp').useValue(item.id)
  if (item.type === 'custom' && !prop) {
    instance.viewOps?.deleteCustomProperty(item.id)
    return null
  }
  return (
    <Reorder.Item
      onDragEnd={() => {
        onDragEnd?.()
        setIsDragging(false)
      }}
      dragListener={false}
      dragControls={controls}
      as={'div'}
      value={item}
      style={{
        borderRight: Colors.Consts.Border,
        color: Colors.Font.Transparent,
        fontSize: 14,
        height: '32px',
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        userSelect: 'none',
        flexShrink: 0
      }}
      onDragStart={() => {
        setIsDragging(true)
      }}
    >
      <Resizable
        className={ClassName.flatButton(0, '0px')}
        enable={{ right: true }}
        minWidth={90}
        style={{
          transition: 'background 0.2s ease',
          background: isDragging ? Colors.Background.ButtonHover : undefined
        }}
        onResize={(event, direction, elementRef) => {
          const newItem = { ...item, width: elementRef.clientWidth }
          onResize(newItem)
        }}
        onResizeStart={() => {
          setIsResizing(true)
        }}
        onResizeStop={(event, direction, elementRef) => {
          const newItem = { ...item, width: elementRef.clientWidth }
          onResizeEnd(newItem)
          setIsResizing(false)
        }}
        handleStyles={{
          right: {
            right: -3,
            width: 6
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
        <AnimatePopover
          align={'start'}
          openOnContextMenu
          positions={['bottom']}
          content={
            <ColumnMenu
              property={{
                name: item.type === 'custom' ? prop?.name : t(item.display),
                icon: prop?.icon || item.icon,
                id: item.id
              }}
              editable={item.editable}
              show={{
                delete: true,
                hide: true
              }}
            />
          }
        >
          <Content
            flex
            gap={6}
            onPointerDown={e => {
              controls.start(e)
            }}
            onClickCapture={e => {
              if (isDragging) {
                e.preventDefault()
              }
            }}
            fullHeight
            fullWidth
            alignItems={'center'}
            style={{
              padding: '2px 8px'
            }}
          >
            {item.icon && <Icon name={item.icon} />}
            <span className={'ellipsis-font-1'}>{item.type === 'custom' ? prop?.name : t(item.display)}</span>
          </Content>
        </AnimatePopover>
      </Resizable>
    </Reorder.Item>
  )
}

export default GroupHeaderItem
