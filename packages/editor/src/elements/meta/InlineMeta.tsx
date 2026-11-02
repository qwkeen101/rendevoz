import { FC } from 'react'
import { RenderElementProps } from 'slate-react'

const InlineMetaElement: FC<RenderElementProps> = ({ element, children, attributes }) => {
  return (
    <span {...attributes} contentEditable={false} data-meta-id={element.id} style={{ padding: '0 4px', borderBottom: '1px dashed' }}>
      {children}
    </span>
  )
}

export default InlineMetaElement
