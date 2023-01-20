import useNoteStore from '@/stores/note.store'
import { useEffect, useRef } from 'react'
import { INote } from '~/typings/data'
import { CustomEditor } from '../types'
import { Descendant } from 'slate'
import { slateNodesToInsertDelta, YjsEditor } from '../yjs'
import Id from '@/utils/id'
import { GlobalProviderMap } from '../Editor'
import { useMemoizedFn } from '@/hooks'
import { serializeEditor } from '../utils/database/serialize'
const initial = [
  {
    id: Id.getId(),
    type: 'paragraph',
    children: [{ text: '' }]
  }
]
const EditorInstanceMap = new Map<number, Set<CustomEditor>>()
const useStoreValue = (note: INote, editor: CustomEditor, provider, doc, sharedType) => {
  const { saveNoteAsBuffer, getNoteValue, updateNote, saveBlocks } = useNoteStore()
  const contentRef = useRef<Descendant[]>()
  const noteId = note?.id
  const contentId = note?.contentId

  useEffect(() => {
    const cleanUp = () => {
      saveNoteAsBuffer(editor.children, note.contentId)
    }
    window.addEventListener('beforeunload', cleanUp)
    const editorSet = EditorInstanceMap.get(noteId)
    if (editorSet && editorSet.size > 0) {
      const first = editorSet.values().next()
      editor.children = first.value.children
      editor.onChange()
      editor.history = { redos: [], undos: [] }
      editor.initialized = true
    } else if (contentId) {
      getNoteValue(contentId).then(v => {
        contentRef.current = v
        editor.children = v || initial
        editor.onChange()
        editor.history = { redos: [], undos: [] }
        editor.initialized = true
        if (sharedType._length === 0) {
          if (contentRef.current) {
            sharedType.applyDelta(slateNodesToInsertDelta(contentRef.current))
          } else {
            sharedType.applyDelta(slateNodesToInsertDelta(initial))
          }
        }
      })
    }
    return () => {
      window.removeEventListener('beforeunload', cleanUp)
      const contentId = saveNoteAsBuffer(editor.children, note?.contentId)
      const result = []
      serializeEditor(editor, editor, result)
      result.forEach(i => (i.noteId = noteId))
      saveBlocks(result)
      doc.destroy()
      if (note?.contentId !== contentId) {
        updateNote({
          id: noteId,
          contentId
        })
      }
    }
  }, [contentId])
  useEffect(() => {
    if (editor) {
      if (!EditorInstanceMap.has(noteId)) {
        const set = new Set<CustomEditor>()
        set.add(editor)
        EditorInstanceMap.set(noteId, set)
      } else {
        EditorInstanceMap.get(noteId)?.add(editor)
      }
      return () => {
        EditorInstanceMap.get(noteId)?.delete(editor)
        if (EditorInstanceMap.get(noteId)?.size === 0) {
          EditorInstanceMap.delete(noteId)
          GlobalProviderMap.delete(noteId)
          provider.clearData()
        }
      }
    }
  }, [editor])

  provider.on(
    'synced',
    useMemoizedFn(() => {
      if (sharedType._length === 0 && contentRef.current) {
        sharedType.applyDelta(slateNodesToInsertDelta(contentRef.current))
      }
      // YjsEditor.connect(editor)
      // avoid undo on synced
    })
  )
}

export default useStoreValue
