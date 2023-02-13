import { globalStore } from '@/stores/stores'
import { SettingAtom } from './Main'

export default () => {
  return globalStore.get(SettingAtom)
}
