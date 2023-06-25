import { useGlobalAtom } from '@/hooks'
import { globalStore } from '@/stores'
import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import _, { merge } from 'lodash'

const localAppState = JSON.parse(localStorage.getItem('appState') || JSON.stringify({}))

localStorage.removeItem('appState')

interface IAppState {
  sidebarCollapsed: boolean
  lastBackupDate?: number
}
const defaultAppState: IAppState = {
  sidebarCollapsed: false
}

const mergedAppState = _.merge(defaultAppState, localAppState) as IAppState
const AppStateAtom = atomWithStorage<IAppState>('appState', mergedAppState)

const useAppState = () => useGlobalAtom(AppStateAtom)

export const getAppState = (): IAppState => {
  const storeAppState = localStorage.getItem('appState')
  return storeAppState ? JSON.parse(storeAppState) : defaultAppState
}

export const setAppState = (newState: Partial<IAppState>) => {
  const currAppState = getAppState()
  const newAppState = _.merge(currAppState, newState)
  localStorage.setItem('appState', JSON.stringify(newAppState))
  globalStore.set(AppStateAtom, newAppState)
}

export default useAppState
