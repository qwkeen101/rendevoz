import { RenderElementProps } from 'slate-react'
import { InlineImageElement } from '~/typings'
import { memo } from 'react'

export default memo(({ element, attributes, children }: RenderElementProps) => {
  const url = (element as InlineImageElement).url
  return (
    <img
      className={'mx-2 my-2'}
      style={{ maxWidth: 'min(200px, 100%)', borderRadius: '4px', maxHeight: '5em', display: 'inline' }}
      src={url}
    />
  )
})
