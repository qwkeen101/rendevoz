import NoteEditor from '@/core/components/editor/noteEditor/NoteEditor'
import { memo } from 'react'
import { css } from '@emotion/css'

function NoteContentDisplayer({ id }: { id: number }) {
  if (id) {
    return (
      <NoteEditor
        readOnly={true}
        layout={{
          showTitle: false,
          showBottomPadding: false,
          showBlockHandle: false,
          showHeader: false,
          disableOverscanInReadOnly: false,
          showProps: false,
          showToolbar: false
        }}
        classNames={{
          editorContainerClassName: css([
            {
              '*': {
                pointerEvents: 'none !important'
              }
            },
            {
              p: {
                padding: 0
              },
              '.ParagraphBlock': {
                margin: '1px 0px !important',
                borderRadius: 0
              }
            }
          ])
        }}
        styles={{
          pageMinPadding: 0,
          containerMaxHeight: '100%',
          containerStyle: {
            padding: '12px 12px 0px'
          },
          editorContainerStyle: {
            overflowY: 'hidden'
          }
        }}
        noteId={id}
        state={{ fontSize: 12, lineSpacing: 1.5, pageWidth: 'Max', typeface: 'Inter' }}
      />
    )
  }
  return null
}

export default memo(NoteContentDisplayer)
