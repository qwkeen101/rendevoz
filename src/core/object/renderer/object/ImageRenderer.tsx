import { Size } from '~/typings'
import { CSSProperties } from 'react'
import { Image } from '@/components'
import { css } from '@emotion/css'

export type ImageRenderProps = Size & {
  ratio?: number
  minWidth?: number
  borderRadius?: number
  style?: CSSProperties
  onImageClick?: React.MouseEventHandler
}
export default ({
  width = 50,
  height = 50,
  ratio = 1,
  borderRadius = 4,
  style,
  minWidth,
  onImageClick,
  imageSrc,
  onSizeChange
}: ImageRenderProps & {
  imageSrc?: string
  onSizeChange?: (size: Size) => void
}) => {
  if (imageSrc) {
    return (
      <Image
        preview
        draggable={false}
        minWidth={minWidth}
        style={{
          borderRadius,
          flexShrink: 0,
          ...style
        }}
        onClick={onImageClick}
        onLoad={e => {
          const img = e.currentTarget
          onSizeChange?.({
            width: img.naturalWidth,
            height: img.naturalHeight
          })
        }}
        className={css({ margin: 'auto 0' })}
        src={imageSrc}
        width={width}
        height={height}
        ratio={ratio}
      />
    )
  }
  return null
}
