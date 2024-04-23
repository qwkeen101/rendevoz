import NoteEditor from '@/core/components/editor/noteEditor/NoteEditor'
import { memo } from 'react'
import { css } from '@emotion/css'

function NoteContentDisplayer({ id, scrollable = false, value }: { id?: number; scrollable?: boolean; value?: any[] }) {
  if (!id && !value) return null
  return (
    <NoteEditor
      readOnly={true}
      layout={{
        canScrollIntoView: false,
        showTitle: false,
        showBottomPadding: false,
        showBlockHandle: false,
        showHeader: false,
        disableOverscanInReadOnly: false,
        overscan: scrollable ? 5 : 0,
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
            '.HeadingBlock': {
              marginTop: '0.2em'
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
        bottomPadding: 100,
        containerStyle: {
          overflow: 'hidden'
        },
        editorContainerStyle: {
          padding: '12px',
          overflowY: scrollable ? 'auto' : 'hidden'
        }
      }}
      defaultValue={value}
      noteId={id}
      state={{ fontSize: 12, lineSpacing: 1.5, pageWidth: 'Max', typeface: 'Inter' }}
    />
  )
}

export default memo(NoteContentDisplayer)
