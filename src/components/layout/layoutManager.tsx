import { LayoutData, PanelData, TabData } from '../base/dock'
import * as Algorithm from '@/components/base/dock/Algorithm'
import { CustomEditor } from '../editor/types'
import EditorPage from '@/scenes/editor'
import Id from '@/utils/id'
import PdfPage from '@/scenes/pdf'
import { DockTabPaneContext } from '../base/dock/DockTabPane'
import { IPdfViewer } from '@/pdfViewer/core/types/pdfViewer'

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

const initializePage = (options: AddTabOptions) => {
  switch (options.type) {
    case 'note':
      return <EditorPage id={Id.getStrId()} noteId={options.noteId} onEditorInitialized={options.onEditorInitalized} />
    case 'pdf':
      return <PdfPage pdfId={options.pdfId} onViewerInitialized={options.onViewerInitialized} />
  }
}

class LayoutManager {
  private layout: LayoutData | null = null
  private changeHandler: ((layout: LayoutData) => void) | null = null

  public registerLayout = (layout: LayoutData) => {
    this.layout = layout
  }
  public registerNewTab = (tab: TabData) => {
    if (this.layout) {
      const currentFocusedPanelId = this.layout.global.currentFocusedPanelId
      if (currentFocusedPanelId) {
        const currentPanel = (Algorithm.find(this.layout, currentFocusedPanelId) || this.layout.dockbox.children[0]) as PanelData
        this.layout = Algorithm.addTabToPanel(this.layout, tab, currentPanel)
        this.changeHandler?.(this.layout)
        return this.layout
      }
    }
  }

  public addTab = (options: AddTabOptions) => {
    if (this.layout) {
      const tabContent = initializePage(options)
      if (tabContent) {
        const id = Id.getStrId()
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
