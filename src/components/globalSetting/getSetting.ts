import { globalStore } from '@/stores'
import { SettingAtom } from './Main'

export default () => {
  return globalStore.get(SettingAtom)
}
