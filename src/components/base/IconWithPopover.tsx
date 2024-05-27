import { AnimatePopover, Content, Icon } from '@/components'
import Tooltip from '@/components/base/Tooltip'
import { useMergedRef } from '@/hooks'
import { CSSProperties, FC, forwardRef, MouseEventHandler, MutableRefObject, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { AnimatePopoverProps } from './AnimatePopover'

interface Props {
  disableNudge?: boolean
  disableCloseOutside?: boolean
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
  onVisiblityChange?: AnimatePopoverProps['onVisiblityChange']
  contentDraggable?: boolean
  iconContainerStyle?: CSSProperties
  onContentClick?: MouseEventHandler
  containerStyle?: CSSProperties
  renderOnParent?: boolean
  withClickCover?: boolean
  onClickOutside?: (e: MouseEvent, setVisible: React.Dispatch<React.SetStateAction<boolean>>) => void
}
const IconWithPopover: FC<Props> = (
  {
    name,
    content,
    withClickCover,
    onClickOutside,
    color,
    align,
    size = 18,
    onVisiblityChange,
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
    boundaryInset = 10,
    disableCloseOutside,
    disableIntersection,
    strokeWidth,
    onContentClick,
    style,
    iconContainerStyle,
    onClick,
    tooltipPosition = 'top',
    closeOnContentClick,
    renderOnParent = false
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
  useEffect(() => {
    onVisiblityChange?.(visible)
  }, [visible])
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
          if (e.target instanceof Element && e.target.closest('[role="modal"]')) {
            return
          }
          if (!disableCloseOutside) {
            setTimeout(() => {
              if (!e.defaultPrevented) setVisible(false)
            }, 0)
          }
        }}
        withClickCover={withClickCover}
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
        {tooltip ? (
          <Tooltip content={tooltip} position={tooltipPosition}>
            <Icon
              style={{ color, ...style }}
              containerStyle={iconContainerStyle}
              cursor="pointer"
              size={size}
              role={'icon'}
              data-active={visible}
              strokeWidth={strokeWidth}
              className={className}
              onClick={e => {
                setVisible(!visible)
                onClick?.(e)
              }}
              name={name}
            />
          </Tooltip>
        ) : (
          <Icon
            style={{ color, ...style }}
            containerStyle={iconContainerStyle}
            cursor="pointer"
            size={size}
            role={'icon'}
            data-active={visible}
            strokeWidth={strokeWidth}
            className={className}
            onClick={e => {
              setVisible(!visible)
              onClick?.(e)
            }}
            name={name}
          />
        )}
      </AnimatePopover>
    </Content>
  )
}

export default forwardRef(IconWithPopover)
