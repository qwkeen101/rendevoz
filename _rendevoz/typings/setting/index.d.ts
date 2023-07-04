/// <reference types="react" />
type AvaliableLanguages = 'en-US' | 'zh-CN'
type Setting = INotificationSetting & IShortCutSetting & IGeneralSetting & IObjectsAndLinkSetting & IComponentSetting & IAppearanceSetting
type IGeneralSetting = {
  general: {
    language?: AvaliableLanguages
    openNewTab: 'always open new tab' | 'open existing tab'
    darkMode: boolean
    customSearchEngineUrl?: string
    userFilePath?: string
    autoBackup: 'never' | 'every day' | '3 days' | 'one week' | 'one month' | 'whenClose'
    backUpPath?: string
    defaultFilePath?: string
    defaultLanguage: string
    dataBackup: 'whenClose' | 'every day' | 'every week' | 'every month' | 'never'
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
export declare const SettingAtom: import('jotai').WritableAtom<
  Setting,
  [typeof import('jotai/vanilla/utils').RESET | Setting | ((prev: Setting) => typeof import('jotai/vanilla/utils').RESET | Setting)],
  void
>
export declare const useSetting: () => [
  Setting,
  (
    args_0: typeof import('jotai/vanilla/utils').RESET | Setting | ((prev: Setting) => typeof import('jotai/vanilla/utils').RESET | Setting)
  ) => void
]

export declare const getSetting: () => Setting
