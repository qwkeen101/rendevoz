import ReadonlyEditor from '@/components/editor/elements/ReadonlyEditor'
import { memo } from 'react'
import { InnerLabelProps } from './Label'

const NoteLabel = memo(({ noteId, noteValue, onTitleChange }: InnerLabelProps) => {

  if (noteValue) {
    return (
      <div style={{ height: '100%', width: '100%', padding: 12, overflowY: 'auto' }}>
        <ReadonlyEditor value={Array.isArray(noteValue) ? noteValue : [noteValue]} />
      </div>
    )
  }
  return null
})

export default NoteLabel
