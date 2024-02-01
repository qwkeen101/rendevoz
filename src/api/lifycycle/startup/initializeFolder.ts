import { getSetting } from '@/core'
import { changeFilePath } from '@/utils'
import KeyvalueStore from '@/api/stores/keyvalue.store'

export default async () => {
  const setting = await KeyvalueStore.fetchOne('userSetting')
  if (setting && setting.general.userFilePath) {
    await changeFilePath(setting.general.userFilePath)
  }
}
