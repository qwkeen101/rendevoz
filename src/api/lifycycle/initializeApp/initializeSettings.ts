import KeyvalueStore, { CurrentKeyValues } from '@/api/stores/keyvalue.store'
import { globalStore } from '@/api/stores'
import { GlobalSetting } from '@/core'
import _ from 'lodash'
import { getDefaultUserFilePath, shouldChangeToNewDefaultUserFilePath } from '@/utils'
import SyncAPI from '@/api/sync'

export const DefaultEditorSettings: CurrentKeyValues['editorSettings'] = {
  editMode: {
    typeface: 'Inter',
    fontSize: 15,
    lineSpacing: 1.4,
    pageWidth: 'Medium'
  },
  readerMode: {
    pageWidth: 'Medium',
    typeface: 'Merriweather',
    fontSize: 18,
    lineSpacing: 1.6
  }
}
let unsub: VoidFunction | undefined = undefined
const subSettingChange = () => {
  unsub?.()
  unsub = globalStore.sub(GlobalSetting.settingAtom, () => {
    if (SyncAPI.states.settingPulled) {
      SyncAPI.states.settingPulled = false
      KeyvalueStore.updateOne('userSetting', GlobalSetting.getSetting(), false)
      return
    }
    KeyvalueStore.updateOne('userSetting', GlobalSetting.getSetting())
  })
}
export default async () => {
  const inDatabaseSetting = await KeyvalueStore.fetchOne('userSetting')

  if (!inDatabaseSetting) {
    await KeyvalueStore.updateOne('userSetting', GlobalSetting.defaultSetting)
  }
  const mergedSetting = _.merge(structuredClone(GlobalSetting.defaultSetting), inDatabaseSetting)

  const path = await getDefaultUserFilePath()
  let changeToNewDefault = false
  if (mergedSetting.general.userFilePath) {
    changeToNewDefault = await shouldChangeToNewDefaultUserFilePath(mergedSetting.general.userFilePath)
  }
  mergedSetting.general.defaultFilePath = path
  if (mergedSetting.general.userFilePath === undefined || changeToNewDefault) {
    mergedSetting.general.userFilePath = path
  }
  GlobalSetting.setSetting(mergedSetting)
  await KeyvalueStore.updateOne('userSetting', mergedSetting)
  subSettingChange()
}
