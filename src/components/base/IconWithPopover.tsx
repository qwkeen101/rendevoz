import { AnimatePopover, Content, Icon } from '@/components'
import Tooltip from '@/components/base/Tooltip'
import { FC, useRef, useState, useEffect, MutableRefObject, useImperativeHandle, forwardRef, CSSProperties } from 'react'

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
}
const IconWithPopover: FC<Props> = (
  {
    name,
    content,
    color,
    align,
    size = 18,
    defaultOpen = false,
    placement = ['top', 'right'],
    className,
    zIndex,
    innerRef,
    padding = 20,
    parentElement,
    disableNudge,
    tooltip,
    boundaryInset = 40,
    disableCloseOutside,
    disableIntersection,
    style
  },
  ref
) => {
  const containerRef = useRef(null)
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
    <Content ref={containerRef}>
      <AnimatePopover
        align={align}
        padding={padding}
        onClickOutside={e => {
          console.log(e)
          if (e.path.some(i => i.getAttribute?.('role') === 'modal')) {
            return
          }
          if (!disableCloseOutside) {
            setTimeout(() => {
              if (!e.defaultPrevented) setVisible(false)
            }, 0)
          }
        }}
        containerStyle={{ zIndex: zIndex?.toString() }}
        parentElement={parentElement || containerRef.current}
        boundaryElement={document.body}
        boundaryInset={boundaryInset}
        visible={visible}
        positions={placement}
        content={content}
        disableNudge={disableNudge}
        disableIntersection={disableIntersection}
      >
        <Tooltip content={tooltip}>
          <Icon
            style={{ color, ...style }}
            cursor="pointer"
            size={size}
            className={className}
            onClick={e => {
              setVisible(!visible)
            }}
            name={name}
          />
        </Tooltip>
      </AnimatePopover>
    </Content>
  )
}

export default forwardRef(IconWithPopover)
