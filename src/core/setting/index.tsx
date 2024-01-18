import { Content } from '@/components/base'
import { globalStore } from '@/api/stores'
import { css } from '@emotion/css'
import { useAtom } from 'jotai/react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import AppearanceSetting from './Appearance'
import ComponentSetting from './Component'
import GeneralSetting from './General'
import NotificationSetting from './Notification'
import ObjectsAndLinksSetting from './ObjectsAndLinks'
import ShortCutSetting from './ShortCut'
import SettingSidebarItem from './SidebarItem'
import UsageSetting from './Usage'
import AISetting from './AI'
import { useUser } from '@/api/services/login.service'
import { KeyToRegisterdSettings } from '@/core/plugin/RegisterMap'
import SettingItem from '@/core/setting/SettingItem'
import {
  INotificationSetting,
  IShortCutSetting,
  IGeneralSetting,
  IObjectsAndLinkSetting,
  IComponentSetting,
  IAppearanceSetting,
  IQuickAddSettings,
  IAISettings
} from './types'
import WorkspaceSetting from '@/core/setting/Workspace'
import EditorSetting from '@/core/setting/Editor'
import { Colors } from '@/consts'
import { atom } from 'jotai'
import { useSelectGlobalAtomValue } from '@/hooks'

enum Settings {
  'general',
  'AI',
  'components',
  'editor',
  'workspace',
  'shortcuts',
  'object and link',
  'notification',
  'resource usage'
  // 'about'
}
type AvaliableLanguages = 'en-US' | 'zh-CN'
export type Setting = INotificationSetting &
  IShortCutSetting &
  IGeneralSetting &
  IObjectsAndLinkSetting &
  IAISettings &
  IComponentSetting &
  IQuickAddSettings &
  IAppearanceSetting

export const defaultSetting: Setting = {
  notification: {
    enabled: true,
    pdf: true,
    label: true,
    collection: true,
    editor: true,
    object: true,
    link: true
  },
  AI: {
    autoGenerateQuestionAfterSummarizing: true,
    questionGenerateNum: 5,
    questionGenerateType: 'text',
    outputLanguage: 'zh-CN'
  },
  shortcut: {},
  quickAdd: {
    noteMetaType: 'block',
    addIntoNote: 'last',
    addIntoGroup: 'last',
    addIntoGroupHideObject: false,
    addIntoNoteHideObject: false,
    addIntoWhiteboardHideObject: false,
    addIntoGroupAutoOpen: false,
    addIntoNoteAutoOpen: false,
    addIntoWhiteboardAutoOpen: false
  },
  general: {
    autoSaveLayout: false,
    defaultLanguage: navigator.language === 'zh-CN' ? 'zh-CN' : 'en-US',
    openNewTab: 'open existing tab',
    darkMode: false,
    copyFileWhenImport: true,
    defaultSearchEngine: 'google',
    defaultImageSearchEngine: 'bing',
    autoBackup: 'never',
    dataBackup: 'never',
    minimizeToTray: false,
    followSystemTheme: false
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
    enableMinimap: false,
    scrollModeInSelect: 'pan',
    enableAddLinkBetweenObjectsWhenConnect: false,
    imageResizeKeepRatio: false,
    snapToObject: true,
    dropFileAutoObject: true,
    defaultLineType: 'curve',
    defaultBackgroundType: 'dot',
    onlyEraseFreeDraw: true
  },
  editor: {
    objectAutoBecomeInline: true
  },
  object: {
    deleteFileWhenDeleteObject: true,
    autoHideLabelObject: false,
    linkType: 'text',
    showPropertiesInComponentPage: true
  },
  translate: {
    autoGotoHoverText: true,
    showOrigWhenHoverText: true
  },
  background: {},
  pdf: {
    renderMode: 'followTheme'
  },
  label: {
    showOriginalText: true
  },
  video: {
    autoPlay: false,
    loop: true
  },
  webpage: {
    enableSearchAutoSuggestion: true
  }
}

export const SettingAtom = atom<Setting>(defaultSetting)

export const useSetting = () => useAtom(SettingAtom, { store: globalStore })
export const useSelectSetting = <T, Slice>(selector: (s: Setting) => Slice) => useSelectGlobalAtomValue(SettingAtom, selector)
const SettingDialog = ({ onClose }: { onClose: VoidFunction }) => {
  const { t } = useTranslation()
  const [currentSettingPanel, setCurrentSettingPanel] = useState<keyof typeof Settings>('general')
  const [user] = useUser()
  const registeredPanels = new Map(Array.from(KeyToRegisterdSettings.values()).map(i => [i.registerPanelName, i.settingItems]))

  const renderContent = () => {
    switch (currentSettingPanel) {
      case 'general':
        return <GeneralSetting />
      case 'AI':
        return <AISetting />
      case 'notification':
        return <NotificationSetting />
      case 'shortcuts':
        return <ShortCutSetting />
      case 'editor':
        return <EditorSetting />
      case 'object and link':
        return <ObjectsAndLinksSetting />
      case 'components':
        return <ComponentSetting />
      case 'appearance':
        return <AppearanceSetting />
      case 'resource usage':
        return user ? <UsageSetting /> : null
      case 'workspace':
        return <WorkspaceSetting />
    }
    if (registeredPanels.has(currentSettingPanel)) {
      const items = registeredPanels.get(currentSettingPanel)

      if (items) {
        return (
          <Content flex column fullHeight>
            {items?.map((i, idx) => <SettingItem {...i} key={idx} />)}
          </Content>
        )
      }
    }
  }
  return (
    <Content
      flex
      style={{
        width: 1100,
        maxWidth: 'calc(100vw - 100px)',
        height: '50vh',
        minHeight: 600,
        maxHeight: 'calc(100vh - 100px)',
        overflow: 'hidden',
        borderRadius: 6
      }}
    >
      <Content
        className={css({
          borderRight: `1px solid ${Colors.Background.Border}`,
          width: '200px',
          padding: '36px 12px 0px',
          overflowY: 'auto',
          fontWeight: 500
        })}
        flex
        column
      >
        {[...Object.keys(Settings), ...registeredPanels.keys()]
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
      <Content style={{ padding: '32px 60px', overflowY: 'auto' }} fullHeight fullWidth flex column gap={36}>
        {renderContent()}
      </Content>
    </Content>
  )
}

export default SettingDialog
