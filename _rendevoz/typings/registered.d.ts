import SettingItem from './setting/Item'

export type RegisteredSetting = {
  registerPanelName: 'plugins' | string
  settingItems: SettingItem[]
}
