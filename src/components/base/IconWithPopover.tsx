import { AnimatePopover, Content, Icon } from '@/components'
import Tooltip from '@/components/base/Tooltip'
import { useMergedRef } from '@/hooks'
import { FC, useRef, useState, useEffect, MutableRefObject, useImperativeHandle, forwardRef, CSSProperties, MouseEventHandler } from 'react'

interface Props {
  disableNudge?: boolean
  disableCloseOutside?: boolean
  disableIntersection?: boolean
  name: string
  content: React.ReactNode
  tooltip?: string
  color?: string
  zIndex?: number
  defaultOpen?: boolean
  placement?: ('bottom' | 'top' | 'left' | 'right')[]
  size?: number
  innerRef?: MutableRefObject<any>
  parentElement?: HTMLElement
  padding?: number
  boundaryInset?: number
  style?: CSSProperties
  align?: string
  className?: string
  onClick?: MouseEventHandler
  tooltipPosition?: 'top' | 'bottom'
  closeOnContentClick?: boolean
  contentDraggable?: boolean
  iconContainerStyle?: CSSProperties
  containerStyle?: CSSProperties
  renderOnParent?: boolean
  onClickOutside?: (e: MouseEvent, setVisible: React.Dispatch<React.SetStateAction<boolean>>) => void
}
const IconWithPopover: FC<Props> = (
  {
    name,
    content,
    onClickOutside,
    color,
    align,
    size = 18,
    defaultOpen = false,
    placement = ['top', 'right'],
    className,
    zIndex,
    innerRef,
    containerStyle,
    padding = 20,
    parentElement,
    contentDraggable,
    disableNudge,
    tooltip,
    boundaryInset = 40,
    disableCloseOutside,
    disableIntersection,
    style,
    iconContainerStyle,
    onClick,
    tooltipPosition = 'top',
    closeOnContentClick,
    renderOnParent = true
  },
  ref
) => {
  const containerRef = useRef(null)
  const mergedRef = useMergedRef(ref, containerRef)
  const [visible, setVisible] = useState(false)
  const close = () => {
    setVisible(false)
  }
  useImperativeHandle(innerRef, () => ({ close }))
  useEffect(() => {
    if (defaultOpen) {
      setVisible(true)
    }
  }, [])
  return (
    <Content
      ref={mergedRef}
      style={containerStyle}
      onClick={() => {
        if (closeOnContentClick && visible) {
          setVisible(false)
        }
      }}
    >
      <AnimatePopover
        align={align}
        padding={padding}
        onClickOutside={e => {
          onClickOutside?.(e, setVisible)
          if (e.path.some(i => i.getAttribute?.('role') === 'modal')) {
            return
          }
          if (!disableCloseOutside) {
            setTimeout(() => {
              if (!e.defaultPrevented) setVisible(false)
            }, 0)
          }
        }}
        contentDraggable={contentDraggable}
        containerStyle={zIndex ? { zIndex: zIndex?.toString() } : undefined}
        parentElement={renderOnParent ? parentElement || containerRef.current || document.body : document.body}
        boundaryElement={document.body}
        boundaryInset={boundaryInset}
        visible={visible}
        positions={placement}
        reposition
        content={content}
        disableNudge={disableNudge}
        disableIntersection={disableIntersection}
      >
        <Tooltip content={tooltip} position={tooltipPosition}>
          <Icon
            style={{ color, ...style }}
            containerStyle={iconContainerStyle}
            cursor="pointer"
            size={size}
            className={className}
            onClick={e => {
              setVisible(!visible)
              onClick?.(e)
            }}
            name={name}
          />
        </Tooltip>
      </AnimatePopover>
    </Content>
  )
}

export default forwardRef(IconWithPopover)
