import NoteEditor from '@/core/components/editor/noteEditor/NoteEditor'
import { memo, useLayoutEffect, useState } from 'react'
import { css } from '@emotion/css'
import { NoteStore } from '@/api/stores'
import EmptyCard from '@/core/components/common/EmptyCard'
import classnames from 'classnames'

const contentClassName = classnames(
  'disable-all-pointer-events',
  css({
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
  })
)
function NoteContentDisplayer({ id, scrollable = false, value }: { id?: number; scrollable?: boolean; value?: any[] }) {
  if (!id && !value) return null
  return (
    <NoteEditor
      readOnly={true}
      layout={{
        displayMode: true,
        showTitle: false,
        emptyPlaceholder: <EmptyCard />,
        showBottomPadding: false,
        showBlockHandle: false,
        showHeader: false,
        disableOverscanInReadOnly: false,
        overscan: scrollable ? 5 : 0,
        showProps: false,
        showToolbar: false
      }}
      classNames={{
        editorContainerClassName: contentClassName
      }}
      styles={{
        pageMinPadding: 0,
        containerMaxHeight: '100%',
        bottomPadding: 100,
        containerStyle: {
          overflow: 'hidden'
        },
        editorContainerStyle: {
          padding: '0.75rem',
          overflowY: scrollable ? 'auto' : 'hidden'
        }
      }}
      defaultValue={value}
      noteId={id}
      state={{ fontSize: 12, lineSpacing: 1.5, pageWidth: 'Max' }}
    />
  )
}

export default memo(NoteContentDisplayer)
