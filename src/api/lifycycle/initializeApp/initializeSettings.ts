import KeyvalueStore, { CurrentKeyValues } from '@/api/stores/keyvalue.store'
import { globalStore } from '@/api/stores'
import { defaultSetting, SettingAtom } from '@/core'
import _ from 'lodash'
import { getDefaultUserFilePath, shouldChangeToNewDefaultUserFilePath } from '@/utils'

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
  unsub = globalStore.sub(SettingAtom, () => {
    KeyvalueStore.updateOne('userSetting', globalStore.get(SettingAtom))
  })
}
export default async () => {
  const inDatabaseSetting = await KeyvalueStore.fetchOne('userSetting')

  if (!inDatabaseSetting) {
    await KeyvalueStore.updateOne('userSetting', defaultSetting)
  }
  const mergedSetting = _.merge(structuredClone(defaultSetting), inDatabaseSetting)

  const path = await getDefaultUserFilePath()
  let changeToNewDefault = false
  if (mergedSetting.general.userFilePath) {
    changeToNewDefault = await shouldChangeToNewDefaultUserFilePath(mergedSetting.general.userFilePath)
  }
  mergedSetting.general.defaultFilePath = path
  if (mergedSetting.general.userFilePath === undefined || changeToNewDefault) {
    mergedSetting.general.userFilePath = path
  }

  globalStore.set(SettingAtom, mergedSetting)
  await KeyvalueStore.updateOne('userSetting', mergedSetting)
  subSettingChange()
}
