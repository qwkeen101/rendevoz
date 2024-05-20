import { Content } from '@/components/base'
import { globalStore } from '@/api/stores'
import { css } from '@emotion/css'
import { useAtom } from 'jotai/react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import ComponentSetting from './Component'
import GeneralSetting from './General'
import ObjectsAndLinksSetting from './ObjectsAndLinks'
import ShortCutSetting from './ShortCut'
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
  ISyncSetting,
  IComponentSetting,
  IAppearanceSetting,
  IQuickAddSettings,
  IAISettings
} from './types'
import WorkspaceSetting from '@/core/setting/Workspace'
import { Colors } from '@/consts'
import { atom } from 'jotai'
import { useSelectGlobalAtomValue } from '@/hooks'
import SyncSetting from './Sync'
import { ClassName } from 'rendevoz'
import { Icon } from '@/components'
import { selectAtom } from 'jotai/utils'

enum Settings {
  'general',
  'workspace',
  'components',
  'shortcuts',
  'object and link',
  // 'sync',
  'AI',
  'resource usage'
  // 'about'
}

const icons: Record<keyof typeof Settings, string> = {
  shortcuts: 'park-command',
  sync: 'custom-cloud',
  workspace: 'park-app-switch',
  general: 'park-all-application',
  components: 'park-components',
  'resource usage': 'park-dashboard-two',
  'object and link': 'park-share-one',
  AI: 'custom-stars'
}
export type Setting = INotificationSetting &
  IShortCutSetting &
  IGeneralSetting &
  IObjectsAndLinkSetting &
  IAISettings &
  IComponentSetting &
  IQuickAddSettings &
  IAppearanceSetting &
  ISyncSetting

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
  sync: {},
  collection: {
    previewItem: false
  },
  AI: {
    autoGenerateQuestionAfterSummarizing: true,
    questionGenerateNum: 5,
    questionGenerateType: 'text',
    outputLanguage: 'zh-CN'
  },
  code: {
    defaultLanguage: 'typescript'
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
  media: {
    openPopoverWhenHighlight: true
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
    expandToFixedSize: false,
    dropFileAutoObject: true,
    defaultLineType: 'curve',
    defaultBackgroundType: 'dot',
    onlyEraseFreeDraw: true
  },
  sidebar: {
    previewTitleMode: false,
    previewCollectionContent: false
  },
  editor: {
    autoOpenHighlightEditor: true,
    objectAutoBecomeInline: false,
    addSpacingInReaderMode: true,
    showHighlightText: true
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
    renderMode: 'followTheme',
    defaultLabelColor: '#ffe082',
    autoWidth: true,
    autoOpenHighlightEditor: true,
    showHighlightText: true
  },
  label: {
    showOriginalText: true
  },
  video: {
    autoPlay: false,
    loop: true
  },
  webpage: {
    saveImageLocally: false,
    enableSearchAutoSuggestion: true
  }
}

export const SettingAtom = atom<Setting>(defaultSetting)
export const SettingAtoms = {
  pdfShowHighlightText: selectAtom(SettingAtom, s => s.pdf.showHighlightText),
  editorShowHighlightText: selectAtom(SettingAtom, s => s.editor.showHighlightText),
  pdfDefaultExpandHighlightDetails: selectAtom(SettingAtom, s => s.pdf.defaultExpandHighlightText),
  editorDefaultExpandHighlightDetails: selectAtom(SettingAtom, s => s.editor.defaultExpandHighlightText)
}
export const enableCustomEditorStateAtom = selectAtom(SettingAtom, s => s.editor.enableFormat)
export const useSetting = () => useAtom(SettingAtom, { store: globalStore })
export const previewSidebarTitleAtom = selectAtom(SettingAtom, s => s.sidebar.previewTitleMode)
export const previewCollectionContentAtom = selectAtom(SettingAtom, s => s.sidebar.previewCollectionContent)
export const useSelectSetting = <T, Slice>(selector: (s: Setting) => Slice) => useSelectGlobalAtomValue(SettingAtom, selector)
const SettingDialog = () => {
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
      case 'shortcuts':
        return <ShortCutSetting />
      case 'object and link':
        return <ObjectsAndLinksSetting />
      case 'components':
        return <ComponentSetting />
      case 'sync':
        return <SyncSetting />
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
  const [settings] = useSetting()
  return (
    <Content
      flex
      style={{
        width: 1150,
        maxWidth: 'calc(100vw - 100px)',
        height: 'calc(100vh - 100px)',
        maxHeight: '715px',
        overflow: 'hidden',
        borderRadius: 12
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '220px',
          padding: '12px 4px',
          overflowY: 'auto',
          flexShrink: 0,
          fontSize: 14,
          background: settings.general.darkMode ? 'rgba(255,255,255,0.03)' : 'rgb(251, 251, 250)'
        }}
      >
        <div
          className={'transparent-font font-size-12 bold-font'}
          style={{
            margin: '0px 0px 6px 12px'
          }}
        >
          {t('general.Settings')}
        </div>
        {[...Object.keys(Settings), ...registeredPanels.keys()]
          .filter(i => isNaN(Number(i)))
          .filter(i => {
            if (i === 'resource usage' && !user) {
              return false
            }
            return true
          })
          .map(i => (
            <Content
              flex
              alignItems={'center'}
              gap={10}
              className={ClassName.flatButton(4, '4px 12px')}
              onClick={() => setCurrentSettingPanel(i)}
              key={i}
              style={{
                background: currentSettingPanel === i ? Colors.Background.ButtonHover : undefined,
                textTransform: 'capitalize',
                fontWeight: currentSettingPanel === i ? 500 : undefined
              }}
            >
              {icons[i] && <Icon name={icons[i]} />}
              <div>{t(`settings.${i}`)}</div>
            </Content>
          ))}
      </div>
      <Content style={{ padding: '32px 60px', overflowY: 'auto' }} fullHeight fullWidth flex column gap={36}>
        {renderContent()}
      </Content>
    </Content>
  )
}

export default SettingDialog
