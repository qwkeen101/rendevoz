import { useEffect } from 'react'
import { CollectionStore, globalStore, MetaStore, ObjectStore } from './stores'
import { atom } from 'jotai'
import { useGlobalSetAtom } from './hooks/jotai'
import { ipcInstance } from './plugins'

export const initializedAtom = atom(false)
export const updateInfoAtom = atom<
  | {
      version: string
    }
  | undefined
>(undefined)
const Initializer = () => {
  const { getAllMetaObjects, getAllMetaLinks } = MetaStore
  const { getAllCollections } = CollectionStore
  const setIntialized = useGlobalSetAtom(initializedAtom)
  useEffect(() => {
    Promise.all([
      getAllMetaLinks(),
      getAllMetaObjects(),
      getAllCollections(),
      ObjectStore('tag').getAll(),
      ObjectStore('pdfLabel').getAll()
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
    If you meet any problem or just interested in how I developed this, just contact me 💬!
    
    🧙🏻‍♂️ RealRong from 🇨🇳.
    `)
    if (import.meta.env.PROD) {
      console.log = (function (origin) {
        return function () {}
      })(console.log)
    }
  }, [])
  return null
}

export default Initializer
