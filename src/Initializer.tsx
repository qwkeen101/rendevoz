import { useEffect } from 'react'
import useCollectionStore from './stores/collection.store'
import useLabelStore from './stores/label.store'
import { documentStore, metaStore, noteStore } from './stores'
import { tagStore } from './stores/tag.store'
import useWhiteboardStore from './stores/whiteboard.store'

const Initializer = () => {
  const { getAllNotes } = noteStore
  const { getAllMetaObjects, getAllMetaLinks } = metaStore
  const { getAllDocuments } = documentStore
  const { getAllCollections } = useCollectionStore()
  const { getAllLabels } = useLabelStore()
  const { getAllTags } = tagStore
  const { getAllWhiteboard } = useWhiteboardStore()
  useEffect(() => {
    getAllTags()
    getAllNotes()
    getAllMetaLinks()
    getAllMetaObjects()
    getAllCollections()
    getAllDocuments()
    getAllLabels()
    getAllWhiteboard()
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
