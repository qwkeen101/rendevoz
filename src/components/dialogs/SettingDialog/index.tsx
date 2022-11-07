import { Content } from '@/components/base'
import Select from '@/components/base/select'
import { useTheme } from '@/hooks'
import { css } from '@emotion/css'
import { FC, MouseEventHandler, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocalStorage } from 'react-use'
import AboutSetting from './About'
import AppearanceSetting from './Appearance'
import EditorSetting from './Editor'
import SettingSidebarItem from './SidebarItem'

enum Settings {
  'appearance',
  'hotkeys',
  'files',
  'editor',
  'about'
}
const SettingDialog = () => {
  const { t,i18n } = useTranslation()
  const [currentSettingPanel, setCurrentSettingPanel] = useState<keyof typeof Settings>('appearance')
  const [value, setValue] = useLocalStorage('lang', undefined, {
    raw: true
  })
  const renderContent = () => {
    switch (currentSettingPanel) {
      case 'appearance':
        return <AppearanceSetting />
      case 'about':
        return <AboutSetting />
      case 'editor':
        return <EditorSetting />
    }
  }
  return (
    <Content flex style={{ width: 800, height: 400 }}>
      <Content
        className={css({
          boxShadow: '7px 0 15px -8px rgba(0,0,0,0.1)',
          height: '100%',
          width: '200px',
          paddingRight: 10
        })}
        flex
        column
      >
        {Object.keys(Settings)
          .filter(i => isNaN(Number(i)))
          .map(i => (
            <SettingSidebarItem onClick={() => setCurrentSettingPanel(i)} key={i} isSelected={i === currentSettingPanel}>
              {t(`settings.${i}`)}
            </SettingSidebarItem>
          ))}
      </Content>
      <Content style={{ padding: '0px 30px' }} fullHeight fullWidth>
        {renderContent()}
      </Content>
    </Content>
  )
}

export default SettingDialog
