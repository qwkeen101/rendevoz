import { CSSProperties, forwardRef, memo, useMemo } from 'react'
import getEmoji from '@/utils/emoji'
import { Content, Icon } from '@/components'
import ClassName from '@/styles/classNames'
import classnames from 'classnames'

export type IconNameRendererProps = {
  name?: string
  icon?: string
  color?: string
  onClick?: React.MouseEventHandler
  style?: CSSProperties
  className?: string
  ellipsisFont?: number
  nameClassName?: string
  gap?: string | number
}

// supports icon: emoji, park, custom, img: tbd
export default memo(
  forwardRef(
    ({ name, icon, color, onClick, gap = '0.5em', style, className, ellipsisFont = 1, nameClassName }: IconNameRendererProps, ref) => {
      const isPark = icon?.startsWith('park') || icon?.startsWith('custom')
      const emoji = useMemo(() => !isPark && icon && getEmoji(icon), [icon])
      return (
        <Content flex alignItems="center" gap={gap} style={{ ...style }} className={className} onClick={onClick} ref={ref}>
          {emoji ? (
            <img
              src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=="
              style={{
                width: '1em',
                height: '1em',
                backgroundImage: `url(${emoji?.imageSrc})`,
                backgroundPositionX: `${(emoji?.x * 100) / 60}%`,
                backgroundPositionY: `${(emoji?.y * 100) / 60}%`,
                backgroundRepeat: 'no-repeat',
                backgroundSize: '6100% 6100%',
                verticalAlign: '-0.1em',
                marginRight: 2
              }}
            />
          ) : (
            <>
              {icon &&
                (isPark ? (
                  <Icon fill={color} name={icon} />
                ) : (
                  <img
                    style={{
                      height: '1em',
                      width: '1em'
                    }}
                    onLoad={e => {
                      e.currentTarget.style.display = 'block'
                    }}
                    onError={e => {
                      e.currentTarget.style.display = 'none'
                    }}
                    src={icon}
                  />
                ))}
            </>
          )}
          <div
            style={{
              color: color
            }}
            className={classnames(ellipsisFont > 0 ? ClassName.ellipsisFont(ellipsisFont) : undefined, nameClassName)}
          >
            {name}
          </div>
        </Content>
      )
    }
  )
)
