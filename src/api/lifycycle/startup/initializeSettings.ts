import KeyvalueStore, { CurrentKeyValues } from '@/api/stores/keyvalue.store'
import { globalStore } from '@/api/stores'
import { defaultSetting, SettingAtom } from '@/core'
import _ from 'lodash'
import { getDefaultUserFilePath } from '@/utils'
import produce from 'immer'

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
const subSettingChange = () =>
  globalStore.sub(SettingAtom, () => {
    KeyvalueStore.updateOne('userSetting', globalStore.get(SettingAtom))
  })
export default async () => {
  const settingInLocalStorage = localStorage.getItem('setting')
  if (settingInLocalStorage) {
    await KeyvalueStore.updateOne('userSetting', JSON.parse(settingInLocalStorage))
    localStorage.removeItem('setting')
  }
  const inDatabaseSetting = await KeyvalueStore.getOne('userSetting')
  console.log(inDatabaseSetting)
  if (!inDatabaseSetting) {
    await KeyvalueStore.updateOne('userSetting', defaultSetting)
  }
  const mergedSetting = _.merge(structuredClone(defaultSetting), inDatabaseSetting)
  if (!mergedSetting.general.userFilePath) {
    const path = await getDefaultUserFilePath()
    mergedSetting.general.defaultFilePath = path
    if (mergedSetting.general.userFilePath === undefined) {
      mergedSetting.general.userFilePath = path
    }
  }
  globalStore.set(SettingAtom, mergedSetting)
  await KeyvalueStore.updateOne('userSetting', mergedSetting)
  subSettingChange()
}
