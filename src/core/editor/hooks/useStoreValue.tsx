import { useEffect, useRef } from 'react'
import { INote } from '~/typings/data'
import { CustomEditor } from '~/typings'
import { Descendant, Transforms } from 'slate'
import Id from '@/utils/id'
import { useDebounceFn, useMemoizedFn } from '@/hooks'
import { serializeEditor } from '../utils/database/serialize'
import { toast } from 'react-hot-toast'
import { Notification } from '@/components'
import getSetting from '@/core/setting/getSetting'
import { useEventHandler, useGlobalEventEmitter } from '@/events'
import { NoteStore, ObjectStore } from '@/stores'
const initial = [
  {
    id: Id.getId(),
    type: 'paragraph',
    children: [{ text: '' }]
  }
]
const EditorInstanceMap = new Map<number, Set<CustomEditor>>()

const normalizeFirstLayer = (editor: CustomEditor) => {
  const firstLayerIdSet = new Set<number>()
  editor.children.forEach((i, idx) => {
    if (firstLayerIdSet.has(i.id)) {
      editor.children[idx].id = Id.getId()
    }
    firstLayerIdSet.add(i.id)
  })
}
const useStoreValue = (note: INote | undefined, editor: CustomEditor, onContentRendered?: (editor: CustomEditor) => void) => {
  const { saveNoteAsBuffer, getNoteValue, saveBlocks, saveNoteAsSearch } = NoteStore
  const contentRef = useRef<Descendant[]>()
  const noteId = note?.id
  const contentId = note?.contentId
  const emitter = useGlobalEventEmitter()

  const handler = useEventHandler('editor')
  const debounceSaveE = useMemoizedFn(data => {
    if (data.noteId === noteId) {
      debouncedSave()
    }
  })
  handler.on('operationApplied', debounceSaveE)
  const { run: debouncedSave } = useDebounceFn(
    () => {
      if (!noteId) return
      if (editor === EditorInstanceMap.get(noteId)?.values().next().value) {
        saveNoteAsBuffer(editor.children, note.contentId)
        saveNoteAsSearch(editor, noteId)
        const setting = getSetting()
        if (setting.notification.enabled && setting.notification.editor) {
          toast.success(<Notification title={`📝 ${note.title}`} content="Note is saved." />)
        }
      }
    },
    { wait: 10000 }
  )
  useEffect(() => {
    if (!noteId || !contentId) {
      console.log('forbid go on')
      return
    }
    emitter.addListener('editor', handler)
    const cleanUp = () => {
      saveNoteAsBuffer(editor.children, note.contentId)
      saveNoteAsSearch(editor, noteId)
    }
    window.addEventListener('beforeunload', cleanUp)
    const editorSet = EditorInstanceMap.get(noteId)
    if (editorSet && editorSet.size > 0) {
      const first = editorSet.values().next()
      editor.children = first.value.children
      normalizeFirstLayer(editor)
      editor.onChange()
      editor.contentInitialized = true
      setTimeout(() => onContentRendered?.(editor))
      editor.history = { redos: [], undos: [] }
      editor.initialized = true
    } else if (contentId) {
      getNoteValue(contentId).then(v => {
        contentRef.current = v
        editor.children = v || initial
        normalizeFirstLayer(editor)
        editor.onChange()
        editor.contentInitialized = true
        setTimeout(() => onContentRendered?.(editor))
        editor.history = { redos: [], undos: [] }
        editor.initialized = true
        // if (sharedType._length === 0) {
        //   if (contentRef.current) {
        //     sharedType.applyDelta(slateNodesToInsertDelta(contentRef.current))
        //   } else {
        //     sharedType.applyDelta(slateNodesToInsertDelta(initial))
        //   }
        // }
      })
    }
    return () => {
      emitter.removeListener('editor', handler)
      window.removeEventListener('beforeunload', cleanUp)
      const contentId = saveNoteAsBuffer(editor.children, note?.contentId)
      saveNoteAsSearch(editor, noteId)
      // const result = []
      // serializeEditor(editor, editor, result)
      // result.forEach(i => (i.noteId = noteId))
      // saveBlocks(result)
      // doc.destroy()
      if (note?.contentId !== contentId) {
        ObjectStore('note').updateOne(
          {
            id: noteId,
            contentId
          },
          { silent: true }
        )
      }
    }
  }, [contentId])
  useEffect(() => {
    if (!noteId) return
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
          // GlobalProviderMap.delete(noteId)
          // provider.clearData()
        }
      }
    }
  }, [editor])

  // provider.on(
  //   'synced',
  //   useMemoizedFn(() => {
  //     if (sharedType._length === 0 && contentRef.current) {
  //       sharedType.applyDelta(slateNodesToInsertDelta(contentRef.current))
  //     }
  //     // YjsEditor.connect(editor)
  //     // avoid undo on synced
  //   })
  // )
}

export default useStoreValue
