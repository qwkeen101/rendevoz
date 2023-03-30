import { LayoutData, PanelData, TabData } from '../base/dock'
import * as Algorithm from '@/components/base/dock/Algorithm'
import EditorPage from '@/scenes/editor'
import Id from '@/utils/id'
import PdfPage from '@/scenes/pdf'
import { DockTabPaneContext } from '../base/dock/DockTabPane'
import { IPdfViewer, CustomEditor, WebpageInstance } from '~/typings'
import { HomePage } from '@/scenes/home'
import DatabasePage from '@/scenes/DatabasePage'
import WhiteboardPage from '@/scenes/WhiteboardPage'
import { LayoutIdToTabMap, LayoutTab } from '.'
import getSetting from '../../core/setting/getSetting'
import WebpagePage from '@/core/webpage/Webpage'

type AddTabOptions =
  | {
      type: 'pdf'
      pdfId: number
      onViewerInitialized: (viewer: IPdfViewer) => void
    }
  | {
      type: 'note'
      noteId: number
      onEditorInitalized: (editor: CustomEditor) => void
    }
  | {
      type: 'whiteboard'
      whiteboardId: number
    }
  | {
      type: 'home'
    }
  | {
      type: 'database'
    }
  | {
      type: 'webpage'
      webpageId: number
      onWebpageInitialized?: (instance: WebpageInstance) => void
      onWebpageChange?: (newWebpageDetails: { webpageId: number }) => void
    }

const initializePage = (options: AddTabOptions) => {
  switch (options.type) {
    case 'note':
      return <EditorPage id={Id.getStrId()} noteId={options.noteId} onEditorInitialized={options.onEditorInitalized} />
    case 'pdf':
      return <PdfPage pdfId={options.pdfId} onViewerInitialized={options.onViewerInitialized} />
    case 'home':
      return <HomePage />
    case 'database':
      return <DatabasePage />
    case 'whiteboard':
      return <WhiteboardPage whiteboardId={options.whiteboardId} />
    case 'webpage':
      return (
        <WebpagePage
          initialWebpageId={options.webpageId}
          onWebpageInitialized={options.onWebpageInitialized}
          onWebpageChange={options.onWebpageChange}
        />
      )
  }
}

class LayoutManager {
  private layout: LayoutData | null = null
  private changeHandler: ((layout: LayoutData) => void) | null = null

  public registerLayout = (layout: LayoutData) => {
    this.layout = layout
  }
  public makeTabActive?: (tabId: string) => void
  public hasTargetTab?: (tab: Partial<LayoutTab>) => string | undefined
  public registerNewTab = (tab: TabData) => {
    if (this.layout) {
      const currentFocusedPanelId = this.layout.global.currentFocusedPanelId
      if (currentFocusedPanelId) {
        console.log(currentFocusedPanelId, this.layout)
        const currentPanel = (Algorithm.find(this.layout, currentFocusedPanelId) || this.layout.dockbox.children[0]) as PanelData
        this.layout = Algorithm.addTabToPanel(this.layout, tab, currentPanel)
        this.changeHandler?.(this.layout)
        return this.layout
      }
    }
  }

  public addTab = (options: AddTabOptions) => {
    if (this.layout) {
      const setting = getSetting()
      if (setting.general.openNewTab === 'open existing tab') {
        let objectId: number | undefined = undefined
        switch (options.type) {
          case 'database':
          case 'home': {
            const tabId = this.hasTargetTab?.({ type: options.type })
            if (tabId) {
              this.makeTabActive?.(tabId)
              return
            }
            break
          }
          case 'note':
            objectId = options.noteId
            break
          case 'pdf':
            objectId = options.pdfId
            break
          case 'whiteboard':
            objectId = options.whiteboardId
            break
          case 'webpage':
            objectId = options.webpageId
        }
        if (objectId) {
          const tabId = this.hasTargetTab?.({ type: options.type, objectId: objectId })
          if (tabId) {
            const layoutTab: LayoutTab | undefined = LayoutIdToTabMap.get(tabId)
            if (layoutTab) {
              switch (options.type) {
                case 'note': {
                  const editor = (layoutTab as LayoutTab & { type: 'note' }).editor
                  editor && options.onEditorInitalized(editor)
                  break
                }
                case 'pdf': {
                  const viewer = (layoutTab as LayoutTab & { type: 'pdf' }).viewer
                  viewer && options.onViewerInitialized(viewer)
                  break
                }
                case 'webpage': {
                  const instance = (layoutTab as LayoutTab & { type: 'webpage' }).instance
                  instance && options.onWebpageInitialized?.(instance)
                  break
                }
              }
            }
            this.makeTabActive?.(tabId)
            return
          }
        }
      }
      let tab: LayoutTab | undefined = undefined
      switch (options.type) {
        case 'note': {
          tab = {
            type: 'note',
            objectId: options.noteId
          }
          const originFunction = options.onEditorInitalized
          options.onEditorInitalized = editor => {
            ;(tab as LayoutTab & { type: 'note' }).editor = editor
            originFunction(editor)
          }
          break
        }
        case 'pdf': {
          tab = {
            type: 'pdf',
            objectId: options.pdfId
          }
          const originFunction = options.onViewerInitialized
          options.onViewerInitialized = v => {
            ;(tab as LayoutTab & { type: 'pdf' }).viewer = v
            originFunction(v)
          }
          break
        }
        case 'home':
          tab = {
            type: 'home'
          }
          break
        case 'database':
          tab = {
            type: 'database'
          }
          break
        case 'whiteboard':
          tab = {
            type: 'whiteboard',
            objectId: options.whiteboardId
          }
          break
        case 'webpage': {
          tab = {
            type: 'webpage',
            objectId: options.webpageId
          }
          const originFunction = options.onWebpageInitialized
          const originChangeFunction = options.onWebpageChange
          options.onWebpageInitialized = i => {
            ;(tab as LayoutTab & { type: 'webpage' }).instance = i
            originFunction?.(i)
          }
          options.onWebpageChange = details => {
            ;(tab as LayoutTab & { type: 'webpage' }).objectId = details.webpageId
            originChangeFunction?.(details)
          }
        }
      }
      const tabContent = initializePage(options)
      if (tabContent) {
        const id = Id.getStrId()
        if (tab) {
          LayoutIdToTabMap.set(id, tab)
        }
        this?.registerNewTab({
          content: <DockTabPaneContext.Provider value={{ currentTabId: id }}>{tabContent}</DockTabPaneContext.Provider>,
          id,
          title: 'New Tab'
        })
      }
    }
  }

  public updateTab = (tab: Partial<TabData>) => {
    if (!tab.id || !this.layout) return
    const targetTab = Algorithm.find(this.layout, tab.id) as TabData
    const targetPanel = targetTab.parent
    const newPanel = Algorithm.clone(targetPanel)
    const idx = newPanel?.tabs.findIndex(i => i === targetTab)
    const newTab = Object.assign({}, targetTab, tab)
    newPanel?.tabs.splice(idx, 1, newTab)
    this.layout = Algorithm.replacePanel(this.layout, targetPanel, newPanel)
    this.changeHandler?.(this.layout)
    return this.layout
  }
  public getLayout = () => {
    return this.layout
  }
  public onLayoutChange = (handler: (layout: LayoutData) => void) => {
    this.changeHandler = handler
  }
}

export default LayoutManager
