import { LayoutData, PanelData, TabData } from '../base/dock'
import * as Algorithm from '@/components/base/dock/Algorithm'
import EditorPage from '@/scenes/editor'
import Id from '@/utils/id'
import PdfPage from '@/scenes/pdf'
import { HomePage } from '@/scenes/HomePage'
import DatabasePage from '@/scenes/DatabasePage'
import WhiteboardPage from '@/scenes/WhiteboardPage'
import { LayoutIdToTabMap } from '.'
import getSetting from '../../core/setting/getSetting'
import WebpagePage from '@/core/webpage/Webpage'
import { AddTabOptions, LayoutTab } from './types'
import ImagePage from '@/scenes/ImagePage'
import { getTabObjectId, normalizeAddTabOptionToLayoutTab, tabCallback } from './utils'

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
    case 'image':
      return <ImagePage imageId={options.imageId} />
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
        // if tab is home or database, directly open it
        if (['database', 'home'].includes(options.type)) {
          const tabId = this.hasTargetTab?.({ type: options.type })
          if (tabId) {
            this.makeTabActive?.(tabId)
            return
          }
        }
        // if tab has objectId, first get objectId
        const objectId = getTabObjectId(options)
        if (objectId) {
          // find if there is existing tab
          const tabId = this.hasTargetTab?.({ type: options.type, objectId: objectId })
          // if there is existing, callback options
          if (tabId) {
            const layoutTab: LayoutTab | undefined = LayoutIdToTabMap.get(tabId)
            if (layoutTab) {
              tabCallback(options, layoutTab)
            }
            this.makeTabActive?.(tabId)
            return
          }
        }
      }
      // no existing tab, add new tab, first normalize it
      const tab = normalizeAddTabOptionToLayoutTab(options)
      const tabContent = initializePage(options)
      console.log(tab, tabContent)
      if (tabContent) {
        const id = Id.getStrId()
        if (tab) {
          LayoutIdToTabMap.set(id, tab)
        }
        this?.registerNewTab({
          content: tabContent,
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
