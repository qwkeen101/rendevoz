import { FC, memo, useRef } from 'react'
import { IWhiteboardNode } from '~/typings/data'
import { InnerNodeProps } from '../WrapperNode'
import { css } from '@emotion/css'
import NoteEditor from '@/core/components/editor/noteEditor/NoteEditor'
import { IEditorInstance } from '~/typings'

const NoteNode: FC<InnerNodeProps> = ({ node: n, onNameChange, metaId }) => {
  const node = n as IWhiteboardNode & { type: 'note' }
  const instance = useRef<IEditorInstance>()
  return (
    <NoteEditor
      metaId={metaId}
      onInstanceInitialized={i => (instance.current = i)}
      on={event => {
        if (event.type === 'titleChange') {
          onNameChange?.(event.value)
        }
      }}
      layout={{
        virtualizer: node.resized ? true : false,
        showHeader: false,
        showBottomPadding: true,
        showBlockHandleAdd: false,
        canScrollIntoView: false
      }}
      title={{
        titleContainerStyle: {
          padding: '30px 0px 5px',
          maxWidth: '100%',
          width: '100%'
        },
        titleStyle: {
          fontSize: '2rem'
        }
      }}
      styles={{
        bottomPadding: 30,
        pageMinPadding: '0px 30px 0px',
        containerHeight: '100%',
        containerMaxHeight: '100%',
        containerStyle: {
          width: '520px',
          minHeight: 'max(100%, 50px)',
          maxWidth: '100%',
          minWidth: '100%'
        }
      }}
      state={{
        fontSize: 17,
        pageWidth: 'Max'
      }}
      classNames={{
        editorContainerClassName: css({
          fontSize: '1em',
          width: '100% !important'
        })
      }}
      noteId={node.noteId}
    />
  )
}

export default memo(NoteNode, (prev, curr) => prev.node === curr.node)
