import classnames from 'classnames'
import { Button, Icon } from '@/components'
import { useIsIn } from '@/hooks'
import React, { CSSProperties, forwardRef, ReactElement } from 'react'
import ContextMenu from '@/components/contextMenu'
import { useTranslation } from 'react-i18next'
import trans from '@/consts/trans'

export default forwardRef(
  (
    {
      image,
      icon,
      name,
      expanded,
      onClick,
      onExpand,
      expandable,
      color,
      childrenSize,
      contextMenu,
      className,
      style,
      textClassName = !name ? 'super-transparent-font' : undefined
    }: {
      image?: string
      icon?: string
      name?: string
      expanded?: boolean
      onClick?: React.MouseEventHandler
      onExpand?: VoidFunction
      expandable?: boolean
      childrenSize?: number
      style?: CSSProperties
      color?: string
      textClassName?: string
      className?: string
      contextMenu?: (setV: (v: boolean) => void) => ReactElement
    },
    outerRef
  ) => {
    const { ref, isIn } = useIsIn(outerRef)
    const { t } = useTranslation()
    const renderInner = () => {
      if (expandable) {
        return (
          <div
            onClick={onClick}
            style={style}
            className={classnames('flex gap-2 items-center icon-button', className)}
            ref={contextMenu ? undefined : ref}
          >
            <div
              onClick={e => {
                e.stopPropagation()
                onExpand?.()
              }}
              className={'relative size-5 shrink-0'}
            >
              <div
                className={classnames(
                  'transition-opacity absolute inset-0 flex items-center justify-center',
                  isIn || (!image && !icon) ? 'opacity-100' : 'opacity-0'
                )}
              >
                <Icon className={classnames('transition-transform', expanded ? 'rotate-90' : undefined)} name={'park-right'} size={16} />
              </div>
              <div
                className={classnames(
                  'transition-opacity absolute inset-0 flex items-center justify-center',
                  isIn ? 'opacity-0' : undefined
                )}
              >
                {image ? <img src={image} className={'size-5 shrink-0 rounded'} /> : <Icon name={icon} size={16} />}
              </div>
            </div>
            <div
              style={{
                color
              }}
              className={classnames('line-clamp-1 font-size-13', textClassName)}
            >
              {name || t(trans.Unnamed)}
            </div>
            <div className={'ml-auto suffix-font text-xs'}>{childrenSize ? childrenSize : undefined}</div>
          </div>
        )
      }
      return (
        <Button.IconButton
          ref={contextMenu ? undefined : ref}
          onClick={onClick}
          text={name || t(trans.Unnamed)}
          image={image}
          icon={icon}
          textClassName={textClassName}
          style={{
            color,
            ...style
          }}
          className={className}
          suffixStr={childrenSize ? `${childrenSize}` : undefined}
        ></Button.IconButton>
      )
    }
    if (contextMenu) {
      return (
        <ContextMenu ref={ref} content={setV => contextMenu(setV)}>
          {renderInner()}
        </ContextMenu>
      )
    }
    return renderInner()
  }
)
