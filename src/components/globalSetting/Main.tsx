import { Content, Icon } from '@/components/base'
import { globalStore } from '@/stores/stores'
import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import { useAtom, useAtomValue } from 'jotai/react'
import { atom } from 'jotai/vanilla'
import { atomWithStorage } from 'jotai/vanilla/utils'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import AboutSetting from './About'
import AppearanceSetting from './Appearance'
import EditorSetting from './Editor'
import GeneralSetting from './General'
import NotificationSetting from './Notification'
import SettingSidebarItem from './SidebarItem'

enum Settings {
  'general',
  // 'hotkeys',
  // 'files',
  'object',
  'editor',
  'pdf',
  'notification'
  // 'about'
}

type Setting = {
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
export const SettingAtom = atomWithStorage<Setting>('setting', {
  notification: {
    enabled: true,
    pdf: true,
    label: true,
    collection: true,
    editor: true,
    object: true,
    link: true
  }
})

export const useSetting = () => useAtom(SettingAtom, { store: globalStore })

const SettingDialog = ({ onClose }: { onClose: VoidFunction }) => {
  const { t, i18n } = useTranslation()
  const [currentSettingPanel, setCurrentSettingPanel] = useState<keyof typeof Settings>('general')
  const renderContent = () => {
    switch (currentSettingPanel) {
      case 'appearance':
        return <AppearanceSetting />
      case 'about':
        return <AboutSetting />
      case 'editor':
        return <EditorSetting />
      case 'general':
        return <GeneralSetting />
      case 'notification':
        return <NotificationSetting />
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
              <div style={{ textTransform: 'capitalize' }}>{i}</div>
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
