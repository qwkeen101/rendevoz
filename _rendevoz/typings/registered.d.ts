import SettingItem from './setting/Item'
import React, { ReactElement } from 'react'

export type RegisteredSetting = {
  registerPanelName: string
  settingItems: SettingItem[]
}

export type RegisteredSidebarItem = {
  key: string
  icon?: string
  text?: () => string
  onClick?: React.MouseEventHandler
  element?: ReactElement
  tooltip?: () => string
}
