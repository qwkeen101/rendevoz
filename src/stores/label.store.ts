import useDb from '@/hooks/stores/useDb'
import { atom } from 'jotai/vanilla'
import toast from 'react-hot-toast'
import { ILabel } from '~/typings/data'
import { initializeLocalStore } from './base.store'
import { IStoreDeprecated } from './store.type'
import getSetting from '@/core/setting/getSetting'

export const labelsAtom = atom<Map<number, ILabel>>(new Map<number, ILabel>())

const useLabelStore = () => {
  const database = useDb('labels')
  const store = initializeLocalStore<ILabel>(labelsAtom, database)
  const shouldToast = (silent?: boolean) => {
    const setting = getSetting()
    if (setting.notification.enabled && setting.notification.label && !silent) {
      return true
    }
    return false
  }
  const localStore: Pick<IStoreDeprecated<ILabel>, 'addOne' | 'deleteOneById' | 'getAll' | 'getOneById' | 'updateOne'> = {
    addOne: store.addOne((obj, silent) => {
      !silent && shouldToast(silent) && toast.success('Label successfully added!')
    }),
    updateOne: store.updateOne((obj, silent) => {
      !silent && shouldToast(silent) && toast.success('Label successfully updated!')
    }),
    deleteOneById: store.deleteOneById(silent => {
      !silent && shouldToast(silent) && toast.success('Label successfully deleted!')
    }),
    getAll: store.getAll(),
    getOneById: store.getOneById()
  }
  const realStore = {
    addLabel: localStore.addOne,
    deleteLabel: localStore.deleteOneById,
    updateLabel: localStore.updateOne,
    getAllLabels: localStore.getAll,
    getLabelById: localStore.getOneById
  }

  return {
    ...realStore
  }
}
export const labelStore = useLabelStore()

export default useLabelStore
