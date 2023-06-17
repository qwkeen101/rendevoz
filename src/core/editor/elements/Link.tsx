import { RenderElementProps } from 'slate-react'
import { useSlateStatic } from '../slate-react'

const Link = ({ element, attributes, children }: RenderElementProps) => {
  const editor = useSlateStatic()
  return (
    <span {...attributes} style={{ display: 'inline' }}>
      <a
        target="_blank"
        onClick={e => {
          editor.on({
            type: 'linkClick',
            e
          })
          setTimeout(() => {
            if (e.defaultPrevented) {
              return
            }
            if (navigator.userAgent.indexOf('Electron') >= 0) {
              window.open(element.url)
              e.preventDefault()
            }
          })
        }}
        href={element.url}
      >
        {children}
      </a>
    </span>
  )
}

export default Link
