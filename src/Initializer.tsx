import { useEffect } from 'react'
import { EditorEventHandler } from './events/editorEvent'
import useEventEmitter from './events/useEventEmitter'
import useDocumentStore from './stores/document.store'
import useMetaStore from './stores/meta.store'
import useNoteStore from './stores/note.store'

const Initializer = () => {
  const { getAllNotes } = useNoteStore()
  const { getAllMetaObjects, getAllMetaLinks } = useMetaStore()
  const { fetchItems } = useDocumentStore()
  const emitter = useEventEmitter()
  useEffect(() => {
    const handler = new EditorEventHandler()
    handler.on('operationApplied', data => {
      console.log(data)
    })
    emitter.addListener('editor',handler)
    getAllNotes()
    getAllMetaLinks()
    getAllMetaObjects()
    fetchItems({ limit: 100 })
  }, [])
  return null
}

export default Initializer
