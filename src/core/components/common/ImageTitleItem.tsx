import { CSSProperties, forwardRef, ReactNode, useState } from 'react'
import classnames from 'classnames'
import { css } from '@emotion/css'
import { getImageMainColor } from '@/core/components'
export default forwardRef(
  (
    {
      title,
      description,
      image,
      onClick,
      aboveTitle,
      id,
      placeholderImage,
      titleStyle,
      placeholderColor,
      imageStyle,
      descriptionClassName,
      className
    }: {
      title: string
      aboveTitle?: ReactNode
      description?: string
      onClick?: VoidFunction
      image?: string
      id: string
      titleStyle?: CSSProperties
      placeholderImage?: string
      placeholderColor?: string
      descriptionClassName?: string
      className?: string
      imageStyle?: CSSProperties
    },
    ref
  ) => {
    const [color, setColor] = useState(!image ? placeholderColor : '#252423')
    return (
      <div
        onClick={onClick}
        ref={ref}
        style={{ color }}
        className={classnames(
          'bg-current *:duration-[400ms] group cursor-pointer h-64 relative w-full rounded-lg overflow-hidden',
          className
        )}
      >
        <div
          style={{
            background: placeholderImage,
            height: '100%'
          }}
          className={classnames(
            css({
              position: 'relative',
              overflow: 'hidden',
              ':after': {
                position: 'absolute',
                bottom: 0,
                width: '100%',
                content: '""',
                boxShadow: '0 0 8px 8px'
              }
            }),
            'group-hover:-translate-y-[10%] transition-transform'
          )}
        >
          {image && (
            <img
              onLoad={async e => {
                const img = e.currentTarget
                getImageMainColor(img, image).then(res => setColor(res))
              }}
              style={{ background: 'currentcolor', ...imageStyle }}
              className={'aspect-video object-cover h-full'}
              src={image}
              crossOrigin={'anonymous'}
            />
          )}
        </div>
        <div className={'absolute top-full left-0 w-full -mt-2.5 group-hover:-translate-y-full transition-transform'}>
          <div
            className={classnames(
              'absolute left-0 bottom-full w-full px-4 z-20',
              css({
                ':before': {
                  zIndex: -1,
                  content: '""',
                  position: 'absolute',
                  width: '100%',
                  left: 0,
                  top: 32,
                  height: 300,
                  background: 'currentcolor',
                  boxShadow: '0 0 36px 40px'
                }
              })
            )}
          >
            {aboveTitle}
            <div style={titleStyle} className={'text-white font-size-18 line-clamp-2 font-semibold'}>
              {title}
            </div>
          </div>
          <div
            className={classnames(
              'text-white line-clamp-3 z-30 px-4 relative opacity-0 group-hover:opacity-85 transition-opacity',
              descriptionClassName
            )}
          >
            {description}
          </div>
        </div>
      </div>
    )
  }
)