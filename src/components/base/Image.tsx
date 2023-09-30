import { css } from '@emotion/css'
import { CSSProperties, FC, ImgHTMLAttributes, ReactNode, useState } from 'react'
import Icon from './Icon'
import ClassName from '@/styles/classNames'
import { GlobalImagePreviewerInstance } from '@/core/global/GlobalImagePreviewer'

const Image: FC<
  ImgHTMLAttributes<HTMLImageElement> & {
    placeHolderSize?: number
    placeHolder?: ReactNode
    ratio?: number
    preview?: boolean
    minWidth?: number
    containerStyle?: CSSProperties
    withoutContainer?: boolean
  }
> = ({
  placeHolderSize = 20,
  placeHolder,
  ratio = 1,
  width = 100,
  className,
  minWidth,
  preview,
  onLoad,
  withoutContainer,
  containerStyle,
  ...rest
}) => {
  const [loaded, setLoaded] = useState(false)
  return (
    <>
      <div
        style={{
          width,
          minWidth: minWidth || width,
          ...containerStyle
        }}
        className={className}
      >
        {withoutContainer ? (
          <div style={{ position: 'relative', width: '100%' }}>
            <img
              className={css({ objectFit: 'contain', width: '100%' })}
              {...rest}
              onLoad={e => {
                setLoaded(true)
                onLoad?.(e)
              }}
              onError={() => setLoaded(false)}
            />
            {preview && (
              <div
                onClick={() => GlobalImagePreviewerInstance.open?.(rest.src)}
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
                  color: 'white',
                  cursor: 'pointer',
                  ':hover': {
                    opacity: 1
                  }
                })}
              >
                <Icon size={20} name="park-preview-open" />
              </div>
            )}
          </div>
        ) : (
          <div
            style={{
              paddingBottom: `${ratio * 100}%`
            }}
            className={css({
              position: 'relative',
              width: '100%',
              height: 0,
              overflow: 'hidden',
              borderRadius: 'inherit'
            })}
          >
            {/*{!loaded && (placeHolder || <Icon size={placeHolderSize} {...rest} fill="#8590aea8" name="park-pic" />)}*/}
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
              onLoad={e => {
                setLoaded(true)
                onLoad?.(e)
              }}
              onError={() => setLoaded(false)}
            />
            {preview && (
              <div
                onClick={() => GlobalImagePreviewerInstance.open?.(rest.src)}
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
                  color: 'white',
                  cursor: 'pointer',
                  ':hover': {
                    opacity: 1
                  }
                })}
              >
                <Icon size={20} name="park-preview-open" />
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}

export default Image
