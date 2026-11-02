import { RenderElementProps } from 'slate-react'
import { FC } from 'react'

const SyncedBlock: FC<RenderElementProps> = ({ element, children, attributes }) => {
  return (
    <div {...attributes} data-sync-id={(element as any).originId} contentEditable={false} style={{ border: '1px dashed var(--border-background)', padding: 8 }}>
      <div style={{ fontSize: '0.9em', opacity: 0.7 }}>Synced block placeholder</div>
      <div>{children}</div>
    </div>
  )
}

export default SyncedBlock
