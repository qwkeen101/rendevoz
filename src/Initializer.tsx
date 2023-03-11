import { useEffect } from 'react'
import useCollectionStore from './stores/collection.store'
import useLabelStore from './stores/label.store'
import { DocumentStore, globalStore, MetaStore, NoteStore } from './stores'
import { tagStore } from './stores/tag.store'
import useWhiteboardStore from './stores/whiteboard.store'
import { atom } from 'jotai'
import { useGlobalSetAtom } from './jotai/jotaiScope'
import { ipcInstance } from './plugins'

export const initializedAtom = atom(false)
export const updateInfoAtom = atom<
  | {
      version: string
    }
  | undefined
>(undefined)
const Initializer = () => {
  const { getAllNotes } = NoteStore
  const { getAllMetaObjects, getAllMetaLinks } = MetaStore
  const { getAllDocuments } = DocumentStore
  const { getAllCollections } = useCollectionStore()
  const { getAllLabels } = useLabelStore()
  const { getAllTags } = tagStore
  const { getAllWhiteboard } = useWhiteboardStore()
  const setIntialized = useGlobalSetAtom(initializedAtom)
  useEffect(() => {
    Promise.all([
      getAllTags(),
      getAllNotes(),
      getAllMetaLinks(),
      getAllMetaObjects(),
      getAllCollections(),
      getAllDocuments(),
      getAllLabels(),
      getAllWhiteboard()
    ]).then(() => {
      setIntialized(true)
    })
    ipcInstance.send('getUpdateDetails').then(res => {
      globalStore.set(updateInfoAtom, {
        version: res.data.version
      })
    })
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
