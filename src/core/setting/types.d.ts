import { IQuestion } from '~/typings'
import langs from '@/consts/langs'

export type IGeneralSetting = {
  general: {
    language?: AvaliableLanguages
    openNewTab: 'always open new tab' | 'open existing tab'
    darkMode: boolean
    copyFileWhenImport: boolean
    customSearchEngineUrl?: string
    minimizeToTray?: boolean
    followSystemTheme?: boolean
    autoRecoverFromBackup?: boolean
    userFilePath?: string
    autoBackup: 'never' | 'every day' | '3 days' | 'one week' | 'one month' | 'whenClose'
    backUpPath?: string
    defaultFilePath?: string
    defaultLanguage: string
    autoSaveLayout: boolean
    youtubeApiKey?: string
    globalCSS?: string
    youtubeMaxItems?: number
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

export type IAISettings = {
  AI: {
    autoGenerateQuestionAfterSummarizing: boolean
    questionGenerateType: IQuestion['questionType']
    questionGenerateNum: number
    outputLanguage: keyof typeof langs
  }
}
export type IQuickAddSettings = {
  quickAdd: {
    addIntoNote: 'first' | 'last'
    noteMetaType: 'block' | 'inline'
    addIntoNoteHideObject: boolean
    addIntoGroup: 'first' | 'last'
    addIntoGroupHideObject: boolean
    addIntoWhiteboardHideObject: boolean
    addIntoGroupAutoOpen: boolean
    addIntoNoteAutoOpen: boolean
    addIntoWhiteboardAutoOpen: boolean
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

export type ISyncSetting = {
  sync: {
    enableSync?: boolean
    S3Config?: {
      bucket?: string
      endpoint?: string
      region?: string
      ak?: string
      sk?: string
    }
    maxSyncSize?: number
    displaySyncState?: boolean
    enableAutoSync?: boolean
    syncInterval?: '30s' | '1m' | '5m' | '30m' | '1h'
    syncDirection?: 'from local to remote' | 'from remote to local'
    localProtection?: boolean
  }
}
export type IShortCutSetting = {
  shortcut: Partial<{
    openSidebar: ShortCut | null
    openMediaSidebar: ShortCut | null
    switchToPrevTab: ShortCut | null
    switchToNextTab: ShortCut | null
    closeCurrentTab: ShortCut | null
    closeOtherTabs: ShortCut | null
    closeRightTabs: ShortCut | null
    closeLeftTabs: ShortCut | null
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
    autoHideLabelObject: boolean
    showPropertiesInComponentPage: boolean
    linkType: 'text' | 'url' | 'markdown' | 'html'
  }
}

export type IComponentSetting = {
  sidebar: {
    previewTitleMode?: boolean
    previewCollectionContent?: boolean
    hideHighlights?: boolean
  }
  label: {
    showOriginalText: boolean
    customTextBackground: boolean
    autoAddAsObject: boolean
  }
  whiteboard: {
    enableMinimap: boolean
    expandToFixedSize?: boolean
    enableAddLinkBetweenObjectsWhenConnect: boolean
    snapToObject: boolean
    imageResizeKeepRatio: boolean
    onlyEraseFreeDraw: boolean
    dropFileAutoObject: boolean
    defaultLineType: 'straight' | 'polyline' | 'curve'
    defaultBackgroundType: 'none' | 'dot' | 'line'
    scrollModeInSelect: 'pan' | 'zoom'
  }
  editor: {
    objectAutoBecomeInline: boolean
    addSpacingInReaderMode?: boolean
    enableFormat?: boolean
  }
  translate: {
    autoGotoHoverText: boolean
    showOrigWhenHoverText: boolean
  }
  webpage: {
    saveImageLocally: boolean
    enableSearchAutoSuggestion: boolean
    autoAddHeadImage?: boolean
  }
  pdf: {
    renderMode: 'followTheme' | 'custom' | 'default'
    customRenderBackground?: string
    customRenderFont?: string
    defaultLabelColor: string
    autoWidth?: boolean
  }
  code: {
    defaultLanguage?: string
  }
  video: {
    loop: boolean
    autoPlay: boolean
    goBackWhenMakingLabel?: number
  }
  media: {
    openPopoverWhenHighlight?: boolean
    clipWhenHighlight?: boolean
  }
}
