import { RenderElementProps } from 'slate-react'
import { useSlateStatic } from '../slate-react'

const Link = ({ element, attributes, children }: RenderElementProps) => {
  const editor = useSlateStatic()
  return (
    <span {...attributes} style={{ display: 'inline' }}>
      <a
        target="_blank"
        onClick={e => {
          if (editor.onLinkClick) {
            editor.onLinkClick?.(e)
            return
          }
          if (navigator.userAgent.indexOf('Electron') >= 0) {
            window.open(element.url)
            e.preventDefault()
          }
        }}
        href={element.url}
      >
        {children}
      </a>
    </span>
  )
}

export default Link
