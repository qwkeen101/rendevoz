import { useEffect } from 'react'
import useMetaStore from './stores/meta.store'
import useNoteStore from './stores/note.store'

const Initializer = () => {
  const { getAllNotes } = useNoteStore()
  const { getAllMetaObjects, getAllMetaLinks } = useMetaStore()
  useEffect(() => {
    getAllNotes()
    getAllMetaLinks()
    getAllMetaObjects()
  }, [])
  return null
}

export default Initializer
