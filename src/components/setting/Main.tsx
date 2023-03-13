import { Content, Icon } from '@/components/base'
import { globalStore } from '@/stores'
import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import { useAtom, useAtomValue } from 'jotai/react'
import { atom } from 'jotai/vanilla'
import { atomWithStorage } from 'jotai/vanilla/utils'
import _ from 'lodash'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import AboutSetting from './About'
import AppearanceSetting from './Appearance'
import EditorSetting from './Editor'
import GeneralSetting from './General'
import NotificationSetting from './Notification'
import ShortCutSetting from './ShortCut'
import SettingSidebarItem from './SidebarItem'

enum Settings {
  'general',
  'notification',
  'shortcuts'
}
type AvaliableLanguages = 'en-US' | 'zh-CN'
type Setting = INotificationSetting &
  IShortCutSetting & {
    general: {
      language: AvaliableLanguages
    }
  }
type INotificationSetting = {
  notification: {
    enabled: boolean
    pdf: boolean
    label: boolean
    collection: boolean
    editor: boolean
    object: boolean
    link: boolean
  }
}
type ShortCut = {
  ctrlKey: boolean
  shiftKey: boolean
  altKey: boolean
  key?: string
}
export type IShortCutSetting = {
  shortcut: Partial<{
    openObjectPanel: ShortCut | null
    openScreenShot: ShortCut | null
    quickCreateObject: ShortCut | null
  }>
}

const localSetting = JSON.parse(localStorage.getItem('setting'))
localStorage.removeItem('setting')
const defaultSetting: Setting = {
  notification: {
    enabled: true,
    pdf: true,
    label: true,
    collection: true,
    editor: true,
    object: true,
    link: true
  },
  shortcut: {},
  general: {
    language: 'en-US'
  }
}
_.merge(defaultSetting, localSetting)
localStorage.setItem('setting', JSON.stringify(defaultSetting))
export const SettingAtom = atomWithStorage<Setting>('setting', defaultSetting)

export const useSetting = () => useAtom(SettingAtom, { store: globalStore })

const SettingDialog = ({ onClose }: { onClose: VoidFunction }) => {
  const { t, i18n } = useTranslation()
  const [currentSettingPanel, setCurrentSettingPanel] = useState<keyof typeof Settings>('general')
  const renderContent = () => {
    switch (currentSettingPanel) {
      case 'general':
        return <GeneralSetting />
      case 'notification':
        return <NotificationSetting />
      case 'shortcuts':
        return <ShortCutSetting />
    }
  }
  return (
    <Content
      flex
      className={ClassName.Background.blurBackground}
      style={{
        width: 1100,
        maxWidth: 'calc(100vw - 100px)',
        height: '50vh',
        minHeight: 600,
        maxHeight: 'calc(100vh - 100px)',
        fontFamily: 'Muli',
        padding: 12,
        borderRadius: 6
      }}
    >
      <Content
        className={css({
          boxShadow: '7px 0 15px -8px rgba(0,0,0,0.1)',
          height: '100%',
          width: '200px',
          paddingRight: 12
        })}
        flex
        column
      >
        {Object.keys(Settings)
          .filter(i => isNaN(Number(i)))
          .map(i => (
            <SettingSidebarItem onClick={() => setCurrentSettingPanel(i)} key={i} isSelected={i === currentSettingPanel}>
              <div style={{ textTransform: 'capitalize' }}>{t(`settings.${i}`)}</div>
            </SettingSidebarItem>
          ))}
      </Content>
      <Content style={{ padding: '0px 30px' }} fullHeight fullWidth>
        {renderContent()}
      </Content>
      <Icon
        name="park-close"
        containerStyle={{ position: 'absolute', top: 8, right: 8, color: 'rgba(31,34,39,0.35)' }}
        className={ClassName.circleButton()}
        onClick={onClose}
      />
    </Content>
  )
}

export default SettingDialog
