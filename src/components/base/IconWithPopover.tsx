import { AnimatePopover, Content, Icon } from '@/components'
import Tooltip from '@/components/base/Tooltip'
import { useMergedRef } from '@/hooks'
import { CSSProperties, FC, forwardRef, MouseEventHandler, MutableRefObject, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { AnimatePopoverProps } from './AnimatePopover'

interface Props {
  disableNudge?: boolean
  disableCloseOutside?: boolean
  disableIntersection?: boolean
  name: string
  content: AnimatePopoverProps['content']
  tooltip?: string
  color?: string
  zIndex?: number
  defaultOpen?: boolean
  strokeWidth?: number
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
  closeOnContentClick?: boolean | string
  contentDraggable?: boolean
  iconContainerStyle?: CSSProperties
  onContentClick?: MouseEventHandler
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
    padding = 10,
    parentElement,
    contentDraggable,
    disableNudge,
    tooltip,
    boundaryInset = 20,
    disableCloseOutside,
    disableIntersection,
    strokeWidth,
    onContentClick,
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
      onClick={e => {
        onContentClick?.(e)
        if (visible) {
          if (typeof closeOnContentClick === 'boolean' && closeOnContentClick) {
            setVisible(false)
          }
          if (typeof closeOnContentClick === 'string') {
            if (e.target instanceof Element && e.target.closest(closeOnContentClick)) {
              setVisible(false)
            }
          }
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
        onVisiblityChange={v => setVisible(v)}
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
            strokeWidth={strokeWidth}
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
