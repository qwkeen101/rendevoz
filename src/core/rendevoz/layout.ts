import { ILayoutTab, TabData } from '~/typings'
import getSetting from '../setting/getSetting'
import { defaultLayout, GlobalLayout, LayoutIdToTabMap } from '@/components/layout'
import Id from '@/utils/id'
import { ReactElement } from 'react'
import { Rendevoz } from '@/core/rendevoz/index'

const TabDataMap = new Map<ILayoutTab['type'], TabData[ILayoutTab['type']]>()

const registerTabData = data => {
  TabDataMap.set(data.type, {
    ...data
  })
}

const openTabInWhiteboard = (data: ILayoutTab) => {
  const currentFocusTab = GlobalLayout?.getCurrentActiveTab()
  console.log(currentFocusTab)
  if (currentFocusTab) {
    if (currentFocusTab.tab?.type === 'whiteboard') {
      const opened = currentFocusTab.tab.instance?.openTabInSidebar?.(data.type, data.objectId)
      return opened
    }
  }
  return false
}

const restoreSavedTab = (tab: { type: string; objectId?: number; id: string; metaType?: string }) => {
  const { type, objectId, id, metaType } = tab
  const tabData = TabDataMap.get(type)
  if (!tabData) return
  const initialized = initializeOneTab(tabData, { type, objectId, metaType })
  if (initialized) {
    const { layoutTab } = initialized
    LayoutIdToTabMap.set(id, layoutTab)
    return {
      content: layoutTab.tabContent,
      id,
      title: 'New Tab',
      type,
      objectId,
      metaType
    }
  }
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
    // const whiteboardTab = openTabInWhiteboard(data)
    // if (whiteboardTab) {
    //   return
    // }
    const maybeExistTab = hasTargetTab(data)
    // open existing tab
    if (maybeExistTab) {
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
    LayoutIdToTabMap.set(id, layoutTab)
    tabData.onTabActive?.()
    console.log(initializedTab)
    GlobalLayout?.registerNewTab({
      content: layoutTab.tabContent,
      id,
      title: 'New Tab',
      type: layoutTab.type,
      objectId: layoutTab.objectId,
      metaType: data.metaType
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
    objectId: openTabData.objectId,
    metaType: openTabData.metaType
  }
  // get rendered element
  const contentElement = tabData.content({
    tab: layoutTab,
    objectId: openTabData.objectId,
    onInstanceInitialized: newInitializedFunction,
    metaType: openTabData.metaType
  })
  if (!contentElement) return
  layoutTab.tabContent = contentElement

  return {
    layoutTab: layoutTab as Required<ILayoutTab>
  }
}

const hasTargetTab = tabData => {
  const { type, objectId, metaType } = tabData
  console.log(LayoutIdToTabMap)
  const target = Array.from(LayoutIdToTabMap.entries()).find(([k, v]) => {
    if (type === v.type) {
      console.log(v)
      if ('objectId' in v && objectId) {
        if (v.objectId === objectId) {
          return k
        }
        return
      }
      if ('metaType' in v && metaType) {
        if (v.metaType === metaType) {
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

const getRegisteredTabContent = <K extends keyof TabData>(type: string): TabData[K]['content'] | undefined => {
  return TabDataMap.get(type)?.content
}
const tabToInstanceMap = new WeakMap<ILayoutTab, any>()

const makeTabActive = tabId => GlobalLayout?.makeTabActive?.(tabId)

const closeAllTabs = (keepHome?: boolean) => {
  LayoutIdToTabMap.clear()
  GlobalLayout?.registerLayout(defaultLayout)
  GlobalLayout?.changeHandler?.(defaultLayout)
  if (keepHome) {
    Rendevoz.Actions.Open.openHome()
  }
}
const Layout = {
  registerTabData,
  openNewTab,
  hasTargetTab,
  makeTabActive,
  initializeOneTab,
  getTabById: id => {
    return LayoutIdToTabMap.get(id)
  },
  getTab,
  closeAllTabs,
  getVisibleTabs,
  restoreSavedTab,
  getRegisteredTabContent
}

export default Layout
