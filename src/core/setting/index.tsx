import { Content, Icon } from '@/components/base'
import { globalStore } from '@/stores'
import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import { useAtom } from 'jotai/react'
import { atomWithStorage } from 'jotai/vanilla/utils'
import _ from 'lodash'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import AppearanceSetting from './Appearance'
import ComponentSetting from './Component'
import GeneralSetting from './General'
import NotificationSetting from './Notification'
import ObjectsAndLinksSetting from './ObjectsAndLinks'
import ShortCutSetting from './ShortCut'
import SettingSidebarItem from './SidebarItem'
import AboutSetting from './About'
import UsageSetting from './Usage'
import { useUser } from '@/services/login.service'

enum Settings {
  'general',
  'appearance',
  'components',
  'shortcuts',
  'object and link',
  'notification',
  'resource usage'
  // 'about'
}
type AvaliableLanguages = 'en-US' | 'zh-CN'
type Setting = INotificationSetting & IShortCutSetting & IGeneralSetting & IObjectsAndLinkSetting & IComponentSetting & IAppearanceSetting
type IGeneralSetting = {
  general: {
    language?: AvaliableLanguages
    openNewTab: 'always open new tab' | 'open existing tab'
    darkMode: boolean
    customSearchEngineUrl?: string
    userFilePath?: string
    autoBackup: 'never' | 'every day' | '3 days' | 'one week' | 'one month'
    backUpPath?: string
    defaultFilePath?: string
    defaultLanguage: string
    defaultSearchEngine:
      | 'custom'
      | 'baidu'
      | 'google'
      | 'bing'
      | 'zhihu'
      | 'google scholar'
      | 'wikipedia'
      | 'wiki summary'
      | 'vocabulary'
      | 'bing dictionary'
      | 'youdao dictionary'
      | 'semantic scholar'
    defaultImageSearchEngine: 'bing' | 'google' | 'pinterest' | 'baidu'
  }
}
export type INotificationSetting = {
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
  metaKey: boolean
  displayKey?: string
}
export type IAppearanceSetting = {
  background: {
    backgroundImage?: string
    backgroundOpacity?: number
    backgroundBlur?: number
  }
}
export type IShortCutSetting = {
  shortcut: Partial<{
    openObjectPanel: ShortCut | null
    openScreenShot: ShortCut | null
    quickCreateObject: ShortCut | null
    openTranslatePanel: ShortCut | null
    openSearchPanel: ShortCut | null
    openGlobalSearch: ShortCut | null
  }>
}
export type IObjectsAndLinkSetting = {
  objectAndLink: {
    enableAll: boolean
    enableDropOnPDFLink: boolean
    enableDropOnWhiteboardLink: boolean
    enableDropOnEditorLink: boolean
    enableDragFromPDFLink: boolean
    enableDragFromEditorLink: boolean
    enableDropAutoGenerateObject: boolean
  }
}
export type IComponentSetting = {
  whiteboard: {
    enableMinimap: boolean
    enableAddLinkBetweenObjectsWhenConnect: boolean
  }
  editor: {
    objectAutoBecomeInline: boolean
  }
  translate: {
    autoGotoHoverText: boolean
    showOrigWhenHoverText: boolean
  }
  webpage: {
    enableSearchAutoSuggestion: boolean
  }
  pdf: {
    renderMode: 'followTheme' | 'custom' | 'default'
    customRenderBackground?: string
    customRenderFont?: string
  }
  video: {
    loop: boolean
    autoPlay: boolean
  }
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
    defaultLanguage: 'en-US',
    openNewTab: 'open existing tab',
    darkMode: true,
    defaultSearchEngine: 'google',
    defaultImageSearchEngine: 'bing',
    autoBackup: 'every day'
  },
  objectAndLink: {
    enableAll: true,
    enableDropOnEditorLink: true,
    enableDropOnPDFLink: true,
    enableDropOnWhiteboardLink: true,
    enableDragFromEditorLink: true,
    enableDragFromPDFLink: true,
    enableDropAutoGenerateObject: true
  },
  whiteboard: {
    enableMinimap: true,
    enableAddLinkBetweenObjectsWhenConnect: false
  },
  editor: {
    objectAutoBecomeInline: true
  },
  translate: {
    autoGotoHoverText: true,
    showOrigWhenHoverText: true
  },
  background: {},
  pdf: {
    renderMode: 'followTheme'
  },
  video: {
    autoPlay: false,
    loop: true
  },
  webpage: {
    enableSearchAutoSuggestion: true
  }
}
_.merge(defaultSetting, localSetting)
localStorage.setItem('setting', JSON.stringify(defaultSetting))
export const SettingAtom = atomWithStorage<Setting>('setting', defaultSetting)

export const useSetting = () => useAtom(SettingAtom, { store: globalStore })

const SettingDialog = ({ onClose }: { onClose: VoidFunction }) => {
  const { t } = useTranslation()
  const [currentSettingPanel, setCurrentSettingPanel] = useState<keyof typeof Settings>('general')
  const [setting] = useSetting()
  const [user] = useUser()
  const renderContent = () => {
    switch (currentSettingPanel) {
      case 'general':
        return <GeneralSetting />
      case 'notification':
        return <NotificationSetting />
      case 'shortcuts':
        return <ShortCutSetting />
      case 'object and link':
        return <ObjectsAndLinksSetting />
      case 'components':
        return <ComponentSetting />
      case 'appearance':
        return <AppearanceSetting />
      case 'resource usage':
        return user ? <UsageSetting /> : null
      case 'about': {
        if (setting.general.language === 'zh-CN') {
          return <AboutSetting />
        }
      }
    }
  }
  return (
    <Content
      flex
      className={ClassName.Background.pseudoBlurContrastBackground}
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
          width: '200px',
          paddingRight: 12
        })}
        flex
        column
      >
        {Object.keys(Settings)
          .filter(i => isNaN(Number(i)))
          .filter(i => {
            if (i === 'resource usage' && !user) {
              return false
            }
            return true
          })
          .map(i => (
            <SettingSidebarItem onClick={() => setCurrentSettingPanel(i)} key={i} isSelected={i === currentSettingPanel}>
              <div style={{ textTransform: 'capitalize' }}>{t(`settings.${i}`)}</div>
            </SettingSidebarItem>
          ))}
      </Content>
      <Content style={{ padding: '0px 30px', overflowY: 'auto' }} fullHeight fullWidth>
        {renderContent()}
      </Content>
    </Content>
  )
}

export default SettingDialog
