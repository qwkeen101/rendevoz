import { IRendevoz } from '~/typings'
import { LayoutIdToTabMap } from '@/components/layout'
import { GlobalInstance } from '@/hooks'

type RendevozLayout = IRendevoz['Actions']['Layout']

const getVisibleTabs = () => {
  return Array.from(LayoutIdToTabMap.values()).filter(i => {
    const tabPane = i.tabElement
    if (tabPane.style.contentVisibility !== 'hidden') {
      return true
    }
    return false
  })
}

const Layout: RendevozLayout = {
  getRegisteredTabContent: type => {
    const tabDta = GlobalInstance.layoutOps?.getRegisteredTabData(type)
    if (tabDta) {
      return tabDta.content
    }
  },
  openNewTab: data => GlobalInstance.layoutOps?.openNewTab(data.data),
  hasTargetTab: data => GlobalInstance.layoutOps?.hasTargetTab(data),
  makeTabActive: tabId => GlobalInstance.layoutOps?.makeTabActive(tabId),
  getTabById: id => {
    return LayoutIdToTabMap.get(id)
  },
  closeAllTabs: k => GlobalInstance.layoutOps?.closeAllTabs(k),
  getVisibleTabs
}

export default Layout
