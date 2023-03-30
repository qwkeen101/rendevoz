import { Editor } from '@/core'
import Id from '@/utils/id'
import { FC, memo, useMemo } from 'react'
import { IWhiteboardNode } from '~/typings/data'
import { InnerNodeProps } from './WrapperNode'

const NoteNode: FC<InnerNodeProps> = ({ node: n, setNodeState, setPopoverElements }) => {
  const node = n as IWhiteboardNode & { type: 'note' }
  const editorId = useMemo(() => Id.getStrId(), [])
  return (
    <div
      style={{
        minWidth: '100%',
        width: '35rem',
        maxWidth: '100%',
        overflow: 'hidden'
      }}
    >
      <Editor
        titleContainerStyle={{
          padding: 'min(30px, 30px * var(--zoom-level)) min(20px, 20px * var(--zoom-level)) 10px min(50px, 50px * var(--zoom-level))'
        }}
        innerEditorStyle={{
          paddingRight: 'min(20px, 20px * var(--zoom-level))',
          paddingLeft: 'min(50px, 50px * var(--zoom-level))'
        }}
        noteId={node.noteId}
        id={editorId}
      />
    </div>
  )
}

export default memo(NoteNode, (prev, curr) => prev.node.noteId === curr.node.noteId)
