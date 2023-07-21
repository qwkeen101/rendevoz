import { Editor } from '@/core'
import Id from '@/utils/id'
import { FC, memo, useMemo } from 'react'
import { IWhiteboardNode } from '~/typings/data'
import { InnerNodeProps } from './WrapperNode'
import { css } from '@emotion/css'

const NoteNode: FC<InnerNodeProps> = ({ node: n, onNameChange }) => {
  const node = n as IWhiteboardNode & { type: 'note' }
  const editorId = useMemo(() => Id.getStrId(), [])
  return (
    <div
      style={{
        minWidth: '100%',
        width: '20rem',
        height: '25rem',
        minHeight: '100%',
        maxWidth: '100%',
        overflow: 'hidden',
        'container-type': 'size'
      }}
    >
      <Editor
        type="note"
        on={event => {
          if (event.type === 'titleChange') {
            onNameChange?.(event.value)
          }
        }}
        showBlockHandle={false}
        titleContainerStyle={{
          padding: '4% 4% 1%',
          maxWidth: '100%',
          width: '100%'
        }}
        titleStyle={{
          fontSize: '4cqmax'
        }}
        showLeftBar={false}
        showRightBar={false}
        compact
        innerEditorStyle={{
          paddingRight: '4%',
          paddingLeft: '4%',
          width: '100%'
        }}
        readonly
        innerEditorClassName={css({
          '.ParagraphBlock': {
            maxWidth: '100%'
          },
          width: '100% !important'
        })}
        noteId={node.noteId}
        id={editorId}
      />
    </div>
  )
}

export default memo(NoteNode, (prev, curr) => prev.node.noteId === curr.node.noteId)
