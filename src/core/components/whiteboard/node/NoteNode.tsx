import { Editor } from '@/core'
import Id from '@/utils/id'
import { FC, memo, useMemo } from 'react'
import { IWhiteboardNode } from '~/typings/data'
import { InnerNodeProps } from './WrapperNode'
import { css } from '@emotion/css'
import NoteEditor from '@/core/components/editor/noteEditor/NoteEditor'

const NoteNode: FC<InnerNodeProps> = ({ node: n, onNameChange }) => {
  const node = n as IWhiteboardNode & { type: 'note' }
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
      <NoteEditor
        on={event => {
          if (event.type === 'titleChange') {
            onNameChange?.(event.value)
          }
        }}
        layout={{
          showHeader: false,
          showBottomPadding: false,
          showToolbar: false,
          showBlockHandle: false
        }}
        title={{
          titleContainerStyle: {
            padding: '10px 0px 8px',
            maxWidth: '100%',
            width: '100%'
          },
          titleStyle: {
            fontSize: '1.5rem'
          }
        }}
        styles={{
          pageMinPadding: '0px 16px'
        }}
        classNames={{
          editorContainerClassName: css({
            fontSize: '1em',
            width: '100% !important'
          })
        }}
        noteId={node.noteId}
      />
    </div>
  )
}

export default memo(NoteNode, (prev, curr) => prev.node.noteId === curr.node.noteId)
