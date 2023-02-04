import { useSetting } from '@/components/globalSetting/Main'
import { useMemoizedFn } from '@/hooks'
import useDb from '@/hooks/stores/useDb'
import { atom } from 'jotai/vanilla'
import { useMemo } from 'react'
import toast from 'react-hot-toast'
import { IPdfDocument } from '~/typings/data'
import BaseStore, { initializeLocalStore } from './base.store'
import { IStore } from './store.type'

export const documentsAtom = atom<Map<number, IPdfDocument>>(new Map())

const { orderedData } = BaseStore

export const allDocumentsAtom = atom(get => orderedData(get(documentsAtom)))

export const undeletedDocumentsAtom = atom(get => get(allDocumentsAtom).filter(i => !i.deleted))

export const pinnedDocumentsAtom = atom(get => get(undeletedDocumentsAtom).filter(i => i.pinned))

const useDocumentStore = () => {
  const database = useDb('documents')
  const [setting] = useSetting()
  const store = initializeLocalStore(documentsAtom, database)
  const shouldToast = setting.notification.enabled && setting.notification.pdf
  const localStore: Pick<IStore<IPdfDocument>, 'addOne' | 'deleteOneById' | 'getAll' | 'getOneById' | 'updateOne'> = {
    addOne: store.addOne((obj, silent) => {
      !silent && shouldToast && toast.success('Document successfully added!')
    }),
    updateOne: store.updateOne((obj, silent) => {
      !silent && shouldToast && toast.success('Document successfully updated!')
    }),
    deleteOneById: store.deleteOneById(silent => {
      !silent && shouldToast && toast.success('Document successfully deleted!')
    }),
    getAll: store.getAll(),
    getOneById: store.getOneById()
  }
  const realStore = {
    getDocumentById: useMemoizedFn(localStore.getOneById),
    addDocument: useMemoizedFn(localStore.addOne),
    deleteDocument: useMemoizedFn(localStore.deleteOneById),
    getAllDocuments: useMemoizedFn(localStore.getAll),
    updateDocument: useMemoizedFn(localStore.updateOne)
  }
  return useMemo(
    () => ({
      ...realStore
    }),
    []
  )
}
export default useDocumentStore
