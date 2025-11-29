import { AnimatePopover, Button } from '@/components'
import { CSSProperties, ForwardedRef, forwardRef, memo, ReactElement, RefObject, useLayoutEffect, useRef } from 'react'
import classnames from 'classnames'
import { Zindexes } from '@/consts'
import { useMergedRef } from '@/hooks'
import { useUpdate } from 'react-use'
import { AnimatePopoverProps } from '@/components/base/AnimatePopover'

type IToolbarItem =
  | {
      type: 'separator'
      key: string
      vertical?: boolean
      className?: string
    }
  | {
      key: string
      type: 'button'
      text?: string
      tooltip?: string | ReactElement
      suffixIcon?: string
      className?: string
      style?: CSSProperties
      icon?: string
      iconClassName?: string
      theme?: string
      textClassName?: string
      renderOnParent?: boolean
      suffixIconClassName?: string
      positions?: AnimatePopoverProps['positions']
      strokeWidth?: number
      onClick?: React.MouseEventHandler
      onPointerDown?: React.PointerEventHandler
      element?: ReactElement
      padding?: number
      popover?: ReactElement | ((setV: (v: boolean) => void) => ReactElement)
    }
  | undefined
  | false
  | null
  | ''
  | 0
export default memo(
  forwardRef<HTMLDivElement, { layout: IToolbarItem[]; className?: string; iconSize?: number; itemClassName?: string }>(
    ({ layout, className, iconSize = 15, itemClassName }, ref: ForwardedRef<HTMLDivElement>) => {
      const containerRef = useRef<HTMLDivElement>()
      const merged = useMergedRef(containerRef, ref)
      const update = useUpdate()
      useLayoutEffect(() => {
        update()
      }, [])
      const renderItem = (item: IToolbarItem) => {
        if (!item) return null
        if (item.type === 'separator') {
          return (
            <div
              key={item.key}
              className={classnames(item.vertical ? 'border-bottom w-6 my-1 mx-auto' : 'border-right h-6 mx-1 my-auto', item.className)}
            ></div>
          )
        }
        if (item.type === 'button') {
          const renderInner = () => {
            if (item.element) return item.element
            return (
              <Button.IconButton
                size={iconSize}
                tooltip={item.tooltip}
                theme={item.theme}
                iconClassName={item.iconClassName}
                strokeWidth={item.strokeWidth}
                style={item.style}
                textClassName={item.textClassName}
                className={
                  itemClassName
                    ? classnames(itemClassName, item.className)
                    : classnames('!h-8', !item.text && '!w-8 !px-0 !justify-center', item.className)
                }
                text={item.text}
                suffixIconClassName={item.suffixIconClassName ?? '-ml-2'}
                key={item.key}
                icon={item.icon}
                suffixIcon={item.suffixIcon}
                onClick={item.onClick}
                onPointerDown={item.onPointerDown}
              />
            )
          }
          return item.popover ? (
            <AnimatePopover
              padding={item.padding ?? 6}
              containerStyle={{
                zIndex: `${Zindexes.EditorSelectionToolbar + 10}`
              }}
              parentElement={item.renderOnParent !== false ? containerRef.current : undefined}
              content={setV => (typeof item.popover === 'function' ? item.popover(setV) : item.popover)}
              positions={item.positions ?? ['bottom', 'top']}
            >
              {renderInner()}
            </AnimatePopover>
          ) : (
            renderInner()
          )
        }
      }
      return (
        <div ref={merged} className={classnames('p-1 flex items-center', className)}>
          {layout.map(i => renderItem(i))}
        </div>
      )
    }
  )
)
