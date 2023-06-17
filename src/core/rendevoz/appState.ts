import { useGlobalAtom } from '@/hooks'
import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import _, { merge } from 'lodash'

const localAppState = JSON.parse(localStorage.getItem('appState') || JSON.stringify({}))

localStorage.removeItem('appState')

interface IAppState {
  sidebarCollapsed: boolean
}
const defaultAppState: IAppState = {
  sidebarCollapsed: false
}

const mergedAppState = _.merge(defaultAppState, localAppState) as IAppState
const AppStateAtom = atomWithStorage<IAppState>('appState', mergedAppState)

const useAppState = () => useGlobalAtom(AppStateAtom)

export default useAppState
