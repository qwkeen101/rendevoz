export type IGeneralSetting = {
  general: {
    language?: AvaliableLanguages
    openNewTab: 'always open new tab' | 'open existing tab'
    darkMode: boolean
    copyFileWhenImport: boolean
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
    makeVideoLabel: ShortCut | null
    copyVideoTimestamp: ShortCut | null
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
  object: {
    deleteFileWhenDeleteObject: boolean
  }
}

export type IComponentSetting = {
  label: {
    showOriginalText: boolean
  }
  whiteboard: {
    enableMinimap: boolean
    enableAddLinkBetweenObjectsWhenConnect: boolean
    snapToObject: boolean
    imageResizeKeepRatio: boolean
    dropFileAutoObject: boolean
    defaultLineType: 'straight' | 'polyline' | 'curve'
    defaultBackgroundType: 'none' | 'dot' | 'line'
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
    goBackWhenMakingLabel?: number
  }
}
