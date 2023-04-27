import { css } from '@emotion/css'
import classNames from 'classnames'
import { FC, ImgHTMLAttributes, ReactNode, useState } from 'react'
import Icon from './Icon'
import ClassName from '@/styles/classNames'
import { GlobalImagePreviewerInstance } from '@/core/global/GlobalImagePreviewer'

const Image: FC<
  ImgHTMLAttributes<HTMLImageElement> & { placeHolderSize?: number; placeHolder?: ReactNode; ratio?: number; preview?: boolean }
> = ({ placeHolderSize = 20, placeHolder, ratio = 1, width = 100, className, preview, ...rest }) => {
  const [loaded, setLoaded] = useState(false)
  return (
    <>
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
              width: '100% !important',
              height: '100% !important',
              objectFit: 'cover',
              margin: '0px !important',
              borderRadius: 'inherit'
            })}
            {...rest}
            onLoad={() => setLoaded(true)}
            onError={() => setLoaded(false)}
          />
          {preview && (
            <div
              className={css({
                position: 'absolute',
                zIndex: 10,
                inset: 0,
                opacity: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0,0,0,0.4)',
                transition: 'all 0.3s ease',
                ':hover': {
                  opacity: 1
                }
              })}
            >
              <Icon
                name="park-preview-open"
                className={ClassName.circleButton()}
                onClick={() => GlobalImagePreviewerInstance.open?.(rest.src)}
              />
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default Image
