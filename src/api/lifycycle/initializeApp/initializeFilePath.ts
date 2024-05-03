import { getSetting } from '@/core'
import { changeFilePath, getDefaultUserFilePath, shouldChangeToNewDefaultUserFilePath } from '@/utils'
import KeyvalueStore from '@/api/stores/keyvalue.store'

export default async () => {
  const userSetting = await KeyvalueStore.fetchOne('userSetting')
  if (userSetting?.general.userFilePath) {
    const defaultFilePath = await getDefaultUserFilePath()
    let changeToNewDefault = false
    changeToNewDefault = await shouldChangeToNewDefaultUserFilePath(userSetting.general.userFilePath)
    if (changeToNewDefault) {
      await KeyvalueStore.updateOne('userSetting', { ...userSetting, general: { ...userSetting.general, userFilePath: defaultFilePath } })
    }
  }
}
