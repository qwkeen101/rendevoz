import { ILayoutTab, TabData } from '~/typings'
import getSetting from '../setting/getSetting'
import { GlobalLayout, LayoutIdToTabMap } from '@/components/layout'
import Id from '@/utils/id'

const TabDataMap = new Map<ILayoutTab['type'], TabData[ILayoutTab['type']]>()

const registerTabData = data => {
  TabDataMap.set(data.type, {
    ...data
  })
}

const openNewTab = ({ data }) => {
  const setting = getSetting()
  const { type } = data
  const tabData = TabDataMap.get(type)
  // current tab type not registered
  if (!tabData) {
    return
  }
  if (setting.general.openNewTab === 'open existing tab') {
    const maybeExistTab = hasTargetTab(data)
    // open existing tab
    if (maybeExistTab) {
      console.log(maybeExistTab)
      makeTabActive(maybeExistTab)
      const targetTab = LayoutIdToTabMap.get(maybeExistTab)
      // data.onInstanceInitialized?.(targetTab?.instance)
      data.onInstanceInitialized?.(tabToInstanceMap.get(targetTab))
      tabData.onTabActive?.()
      return
    }
  }
  // initialize new tab
  const initializedTab = initializeOneTab(tabData, data)
  if (initializedTab) {
    const { layoutTab } = initializedTab
    const id = Id.getStrId()
    console.log(layoutTab)
    LayoutIdToTabMap.set(id, layoutTab)
    tabData.onTabActive?.()
    GlobalLayout?.registerNewTab({
      content: layoutTab.tabContent,
      id,
      title: 'New Tab'
    })
  }
}

const initializeOneTab = (tabData, openTabData) => {
  if (!openTabData.type) return
  const originInitializeFunction = openTabData.onInstanceInitialized
  const newInitializedFunction = i => {
    layoutTab.instance = i
    tabToInstanceMap.set(layoutTab, i)
    originInitializeFunction?.(i)
  }
  const layoutTab: Partial<ILayoutTab> = {
    type: openTabData.type,
    objectId: openTabData.objectId
  }
  // get rendered element

  const contentElement = tabData.content({
    tab: layoutTab,
    objectId: openTabData.objectId,
    onInstanceInitialized: newInitializedFunction
  })
  if (!contentElement) return
  layoutTab.tabContent = contentElement

  return {
    layoutTab: layoutTab as Required<ILayoutTab>
  }
}

const hasTargetTab = tabData => {
  const { type, objectId } = tabData

  const target = Array.from(LayoutIdToTabMap.entries()).find(([k, v]) => {
    if (type === v.type) {
      console.log(v)
      if ('objectId' in v && objectId) {
        if (v.objectId === objectId) {
          return k
        }
        return
      }
      return k
    }
  })

  return target?.[0]
}

const getTab = opts => {
  const tabId = hasTargetTab({
    type: opts.type,
    objectId: opts.objectId
  })
  if (tabId) {
    return LayoutIdToTabMap.get(tabId)
  }
}

const getVisibleTabs = () => {
  return Array.from(LayoutIdToTabMap.values()).filter(i => {
    const tabPane = i.tabElement
    if (tabPane.style.contentVisibility !== 'hidden') {
      return true
    }
    return false
  })
}
const tabToInstanceMap = new WeakMap<ILayoutTab, any>()

const makeTabActive = tabId => GlobalLayout?.makeTabActive?.(tabId)

const Layout = {
  registerTabData,
  openNewTab,
  hasTargetTab,
  makeTabActive,
  initializeOneTab,
  getTab,
  getVisibleTabs
}

export default Layout
