import { DockLayout, PanelData, TabData } from '@/components/base/dock'
import * as Algorithm from '@/components/base/dock/Algorithm'
import { LayoutIdToTabMap } from '@/components/layout/index'

export function getCurrentFocusedTab(layout: DockLayout) {
  const layoutData = layout.getLayout()
  const focusedPanelId = layoutData.global.currentFocusedPanelId
  if (focusedPanelId) {
    const panel = layoutData.dockbox.children.find(i => i.id === focusedPanelId) as PanelData | undefined
    if (panel) {
      const tab = panel.tabs.find(i => i.id === panel.activeId)
      if (tab) {
        return tab
      }
    }
  }
}
export function closeTab(tabId: string, layout: DockLayout) {
  const targetTab = layout.find(tabId)
  if (targetTab) {
    layout.dockMove(targetTab, null, 'remove')
    LayoutIdToTabMap.delete(tabId)
  }
}

export function makeTabActive(tabId: string, layout: DockLayout) {
  const targetTab = layout.find(tabId) as TabData | undefined
  if (targetTab) {
    layout.updateTab(tabId, null, true)
  }
}

export function addNewTab(tab: TabData, layout: DockLayout) {
  const layoutData = layout.getLayout()
  const currentFocusedPanelId = layoutData.global.currentFocusedPanelId || layoutData.dockbox?.children[0]?.id
  if (currentFocusedPanelId) {
    const currentPanel = (Algorithm.find(layoutData, currentFocusedPanelId) || layoutData.dockbox.children[0]) as PanelData
    const nextLayout = Algorithm.addTabToPanel(layoutData, tab, currentPanel)
    layout.changeLayout(nextLayout)
    layout.setLayout(nextLayout)
  }
}
