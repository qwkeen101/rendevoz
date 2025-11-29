import { CSSProperties, memo } from 'react'
import classnames from 'classnames'

export default memo(
  ({
    url,
    style,
    className,
    onLoad
  }: {
    url: string
    style?: CSSProperties
    className?: string
    onLoad?: (e: HTMLImageElement) => void
  }) => {
    return (
      <div style={style} className={classnames('relative', className)}>
        <img
          className={'-z-10 object-cover w-full h-full inset-0 absolute'}
          style={{
            filter: 'blur(20px) saturate(2)',
            opacity: 0.3,
            transform: 'scale(0.88)',
            transformOrigin: 'bottom center',
            borderRadius: 'inherit'
          }}
          src={url}
        />
        <img
          onLoad={e => {
            onLoad?.(e.currentTarget)
          }}
          style={{
            borderRadius: 'inherit'
          }}
          className={'inset-0 w-full h-full object-cover absolute'}
          src={url}
        />
      </div>
    )
  }
)
