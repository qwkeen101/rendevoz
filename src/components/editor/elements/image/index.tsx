import { css } from '@emotion/css'
import { RenderElementProps } from 'slate-react'

const Image = ({ element, children, attributes }: RenderElementProps) => {
  return (
    <div {...attributes}>
      <div
        className={css({
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          userSelect: 'none'
        })}
      >
        <img
          className={css({
            objectFit: 'cover',
            borderRadius: 10,
            width: '100%',
            maxWidth: 400
          })}
          draggable={false}
          src={element.url}
        />
      </div>
      {children}
    </div>
  )
}
export default Image
