import { memo } from 'react'
import { Icon } from '@/components'
import classnames from 'classnames'

export default memo(
  ({
    count,
    text,
    icon,
    iconSize,
    onClick,
    spin,
    countClassName,
    numberCount
  }: {
    count?: number
    numberCount?: boolean
    text?: string
    icon?: string
    iconSize?: number
    spin?: boolean
    countClassName?: string
    onClick?: React.MouseEventHandler
  }) => {
    return (
      <div onClick={onClick} className={'flex gap-2 items-center'}>
        {icon && <Icon spin={spin} name={icon} size={iconSize} />}
        {text}
        {count !== undefined && count > 0 && (
          <div className={classnames('px-1 em:text-sm', countClassName, numberCount ? 'font-bold opacity-60' : 'rounded bg-border')}>
            {count}
          </div>
        )}
      </div>
    )
  }
)
