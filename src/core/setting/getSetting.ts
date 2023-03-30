import { globalStore } from '@/stores'
import { SettingAtom } from '.'

export default () => {
  return globalStore.get(SettingAtom)
}
