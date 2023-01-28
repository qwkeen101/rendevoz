import { useEffect } from 'react'
import useCollectionStore from './stores/collection.store'
import useDocumentStore from './stores/document.store'
import useLabelStore from './stores/label.store'
import useMetaStore from './stores/meta.store'
import useNoteStore from './stores/note.store'

const Initializer = () => {
  const { getAllNotes } = useNoteStore()
  const { getAllMetaObjects, getAllMetaLinks } = useMetaStore()
  const { getAllDocuments } = useDocumentStore()
  const { getAllCollections } = useCollectionStore()
  const { getAllLabels } = useLabelStore()
  useEffect(() => {
    getAllNotes()
    getAllMetaLinks()
    getAllMetaObjects()
    getAllCollections()
    getAllDocuments()
    getAllLabels()
    console.log(`
    Welcome to use Rendevoz to BOOST your work efficency 💪🏻!
    This is a 🆓 software in beta test. Feel free to use!
    If you meet any problem or just interested in how I developed this, just contact me 💬!
    Yours 👋,
    🧙🏻‍♂️ RealRong 2001 from 🇨🇳.
    `)
    // console.log = (function (origin) {
    //   return function () {}
    // })(console.log)
  }, [])
  return null
}

export default Initializer
