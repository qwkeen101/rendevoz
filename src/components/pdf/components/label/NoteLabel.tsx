import ReadonlyEditor from '@/components/editor/elements/ReadonlyEditor'
import { GlobalScope } from '@/jotai/jotaiScope'
import { notesAtom } from '@/stores/note.store'
import { atom, useAtomValue } from 'jotai'
import { memo, useEffect, useMemo } from 'react'
import { InnerLabelProps } from './Label'

const NoteLabel = memo(({ noteId, noteValue, onTitleChange }: InnerLabelProps) => {
  const noteAtom = useMemo(() => (noteId ? atom(get => get(notesAtom).get(noteId)) : atom(null)), [noteId])
  const note = useAtomValue(noteAtom, GlobalScope)
  useEffect(() => {
    onTitleChange?.(`📝 ${note?.title}`)
  }, [note])

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
