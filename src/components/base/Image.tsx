import { css } from '@emotion/css'
import classNames from 'classnames'
import { FC, ImgHTMLAttributes, ReactNode, useState } from 'react'
import Icon from './Icon'

const Image: FC<ImgHTMLAttributes<HTMLImageElement> & { placeHolderSize?: number; placeHolder?: ReactNode; ratio?: number }> = ({
  placeHolderSize = 20,
  placeHolder,
  ratio = 1,
  width = 100,
  className,
  ...rest
}) => {
  const [loaded, setLoaded] = useState(false)
  return (
    <div
      className={classNames(
        css({
          width,
          minWidth: width
        }),
        className
      )}
    >
      <div
        className={css({
          position: 'relative',
          paddingBottom: `${ratio * 100}%`,
          width: '100%',
          height: 0,
          overflow: 'hidden',
          borderRadius: 'inherit'
        })}
      >
        {!loaded && (placeHolder || <Icon size={placeHolderSize} {...rest} fill="#8590aea8" name="park-pic" />)}
        <img
          className={css({
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: 'inherit'
          })}
          {...rest}
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(false)}
        />
      </div>
    </div>
  )
}

export default Image
