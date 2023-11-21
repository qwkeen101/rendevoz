import { LayoutData, PanelData, TabData } from '../base/dock'
import * as Algorithm from '@/components/base/dock/Algorithm'
import { LayoutIdToTabMap } from '@/components/layout/index'

class LayoutManager {
  private layout: LayoutData | null = null
  private changeHandler: ((layout: LayoutData) => void) | null = null

  public registerLayout = (layout: LayoutData) => {
    this.layout = layout
  }
  public makeTabActive?: (tabId: string) => void

  public registerNewTab = (tab: TabData) => {
    if (this.layout) {
      const currentFocusedPanelId = this.layout.global.currentFocusedPanelId || this.layout.dockbox?.children[0]?.id
      if (currentFocusedPanelId) {
        const currentPanel = (Algorithm.find(this.layout, currentFocusedPanelId) || this.layout.dockbox.children[0]) as PanelData
        this.layout = Algorithm.addTabToPanel(this.layout, tab, currentPanel)
        this.changeHandler?.(this.layout)
        return this.layout
      }
    }
  }
  public getCurrentActiveTab = () => {
    if (this.layout) {
      const currentFocusedPanelId = this.layout.global.currentFocusedPanelId
      if (currentFocusedPanelId) {
        console.log(currentFocusedPanelId, this.layout)
        const currentPanel = (Algorithm.find(this.layout, currentFocusedPanelId) || this.layout.dockbox.children[0]) as PanelData
        const currentTab = currentPanel.tabs.find(i => i.id === currentPanel.activeId)
        if (currentTab?.id) {
          const tab = LayoutIdToTabMap.get(currentTab.id)
          return {
            tab,
            id: currentTab.id
          }
        }
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
