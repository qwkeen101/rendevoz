import { css } from '@emotion/css'
import { CSSProperties, FC, ImgHTMLAttributes } from 'react'
import Icon from './Icon'

const Image: FC<
  ImgHTMLAttributes<HTMLImageElement> & {
    ratio?: number
    preview?: boolean
    minWidth?: number
    containerStyle?: CSSProperties
    withoutContainer?: boolean
  }
> = ({ ratio = 1, width = 100, className, minWidth, preview, onLoad, withoutContainer, containerStyle, ...rest }) => {
  return (
    <>
      <div
        style={{
          width,
          overflow: 'hidden',
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
                onLoad?.(e)
              }}
            />
            {preview && (
              <div
                onClick={e => {
                  e.preventDefault()
                  Global.commonOps?.previewImage?.(rest.src)
                }}
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
                onLoad?.(e)
              }}
            />
            {preview && (
              <div
                onClick={e => {
                  e.preventDefault()
                  Global.commonOps?.previewImage?.(rest.src)
                }}
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
