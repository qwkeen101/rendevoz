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
        width: '30rem',
        height: '40rem',
        minHeight: '100%',
        maxWidth: '100%',
        overflow: 'hidden',
        maxHeight: '100%'
      }}
    >
      <Editor
        type="note"
        on={event => {
          if (event.type === 'titleChange') {
            onNameChange?.(event.value)
          }
        }}
        showHeader={false}
        showBlockHandle={false}
        titleContainerStyle={{
          padding: '10px 16px 8px',
          maxWidth: '100%',
          width: '100%'
        }}
        titleStyle={{
          fontSize: '1.6rem'
        }}
        innerEditorStyle={{
          paddingRight: '16px',
          paddingLeft: '16px',
          width: '100%'
        }}
        noBottomPadding={true}
        innerEditorClassName={css({
          fontSize: '1em',
          '.ParagraphBlock': {
            maxWidth: '100%',
            marginTop: 2,
            marginBottom: 2,
            fontSize: '1em',
            padding: '2px 0px'
          },
          p: {
            fontSize: '1em',
            marginTop: 0,
            marginBottom: 0,
            lineHeight: 1.4
          },
          '.BlockCommon': {
            lineHeight: 1.4
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
