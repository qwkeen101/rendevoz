import { ReactElement } from 'react'
import { ILayoutTab } from '~/typings'
import getSetting from '../setting/getSetting'
import { LayoutIdToTabMap } from '@/components/layout'
import { GlobalLayout } from '@/components/layout'
import Id from '@/utils/id'

export type TabData = {
  [K in ILayoutTab['type']]: {
    type: K
    content: (options: {
      tab: ILayoutTab
      objectId?: number
      onInstanceInitialized?: (instance: Extract<ILayoutTab, { type: K }>['instance']) => void
    }) => ReactElement | undefined | false | 0
    onTabActive?: () => void
  }
}

const TabDataMap = new Map<ILayoutTab['type'], TabData[ILayoutTab['type']]>()

const registerTabData = <K extends ILayoutTab['type']>(options: TabData[K]) => {
  TabDataMap.set(options.type, {
    ...options
  })
}

type OpenTabOptions<K extends ILayoutTab['type']> = {
  data: { objectId?: number; onInstanceInitialized?: (instance: Extract<ILayoutTab, { type: K }>['instance']) => void } & Omit<
    TabData[K],
    'content'
  >
}

const openNewTab = <T extends ILayoutTab['type']>({ data }: OpenTabOptions<T>) => {
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
  console.log(initializedTab)
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

const initializeOneTab = <T extends ILayoutTab['type']>(
  tabData: TabData[ILayoutTab['type']],
  openTabData: OpenTabOptions<T>['data']
):
  | {
      layoutTab: ILayoutTab
    }
  | undefined => {
  if (!openTabData.type) return
  const originInitializeFunction = openTabData.onInstanceInitialized
  const newInitializedFunction = (i: Extract<ILayoutTab, { type: T }>['instance']) => {
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

const hasTargetTab = <T extends ILayoutTab['type']>(tabData: OpenTabOptions<T>['data']) => {
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

const getTab = <T extends ILayoutTab['type']>(opts: { objectId?: number; type: T }) => {
  const tabId = hasTargetTab({
    type: opts.type,
    objectId: opts.objectId
  })
  if (tabId) {
    return LayoutIdToTabMap.get(tabId) as ILayoutTab & { type: T }
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

const makeTabActive = (tabId: string) => GlobalLayout?.makeTabActive?.(tabId)

const Layout = {
  registerTabData,
  openNewTab,
  hasTargetTab,
  makeTabActive,
  getTab,
  getVisibleTabs
}

export default Layout
