import { FC, memo } from 'react'
import { RenderElementProps } from 'slate-react'

const MetaObject: FC<RenderElementProps> = memo(({ children, element }) => {
  return (
    <div data-meta-id={(element as any).originId} contentEditable={false} style={{ border: '1px dashed var(--border-background)', padding: 8 }}>
      <div style={{ fontSize: '0.9em', opacity: 0.7 }}>Meta object placeholder</div>
      {children}
    </div>
  )
})

export default MetaObject
