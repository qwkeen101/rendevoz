import EventEmitter from '@/events/eventEmitter'
import { LayoutData, PanelData, TabData } from '../base/dock'
import * as Algorithm from '@/components/base/dock/Algorithm'

class LayoutManager {
  private layout: LayoutData | null = null
  private emitter: EventEmitter | null = null
  private changeHandler: ((layout: LayoutData) => void) | null = null

  public registerLayout = (layout: LayoutData) => {
    this.layout = layout
    console.log('register')
  }
  public registerEmitter = (emitter: EventEmitter) => {
    this.emitter = emitter
  }
  public registerNewTab = (tab: TabData) => {
    if (this.layout) {
      const currentFocusedPanelId = this.layout.global.currentFocusedPanelId
      if (currentFocusedPanelId) {
        const currentPanel = (Algorithm.find(this.layout, currentFocusedPanelId) || this.layout.dockbox.children[0]) as PanelData
        console.log(currentPanel)
        this.layout = Algorithm.addTabToPanel(this.layout, tab, currentPanel)
        return this.layout
      }
    }
  }
  public updateTab = (tab: Partial<TabData>) => {
    console.log(tab)
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
