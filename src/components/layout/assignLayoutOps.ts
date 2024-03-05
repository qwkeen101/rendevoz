import { GlobalInstance } from '@/hooks'
import { assignProperties } from '@/utils'
import { DockLayout, TabData as DockTabData } from '@/components/base/dock'
import { addNewTab, closeTab, getCurrentFocusedTab } from '@/components/layout/utils'
import { RefObject } from 'react'
import { BuiltInTabTypes, ILayoutTab, OpenTabOptions, TabData } from '~/typings'
import { defaultLayout, LayoutIdToTabMap } from '@/components/layout/index'
import Id from '@/utils/id'
import { Rendevoz } from '@/core/rendevoz'

const RegisterTabDataMap = new Map<BuiltInTabTypes['type'], TabData[BuiltInTabTypes['type']]>()
const initializeOneTab = (registeredData: TabData[BuiltInTabTypes['type']], options: OpenTabOptions<BuiltInTabTypes['type']>) => {
  if (!options.type) return
  const originInitializeFunction = options.onInstanceInitialized
  const layoutTab: Partial<ILayoutTab> = {
    type: options.type,
    objectId: options.objectId,
    metaType: options.metaType
  }
  const newInitializedFunction = (i: BuiltInTabTypes['instance']) => {
    layoutTab.instance = i
    originInitializeFunction?.(i)
  }

  // get rendered element
  const contentElement = registeredData.content({
    tab: layoutTab,
    objectId: options.objectId,
    onInstanceInitialized: newInitializedFunction,
    metaType: options.metaType
  })
  if (!contentElement) return
  layoutTab.tabContent = contentElement

  return layoutTab
}

export default function assignGlobalLayoutOps(layoutRef: RefObject<DockLayout>) {
  assignProperties(GlobalInstance, {
    layoutOps: {
      getCurrentFocusedTab: () => {
        const layout = layoutRef.current
        if (!layout) return
        return getCurrentFocusedTab(layout)?.id
      },
      switchToTab: direction => {
        const currFocused = GlobalInstance.layoutOps?.getCurrentFocusedTab()
        if (currFocused) {
          const currFocusedTab = layoutRef.current?.find(currFocused) as DockTabData | undefined
          if (currFocusedTab) {
            const parentLength = currFocusedTab.parent?.tabs.length ?? 0
            const currIdx = currFocusedTab.parent?.tabs.findIndex(i => i === currFocusedTab)
            if (currIdx === undefined || currIdx < 0) return
            let next = 0
            if (direction === 'next') {
              next = currIdx + 1
              if (next === parentLength) {
                next = 0
              }
            }
            if (direction === 'prev') {
              next = currIdx - 1
              if (next < 0) {
                next = parentLength - 1
              }
            }
            if (next >= 0 && next !== currIdx) {
              const tab = currFocusedTab.parent?.tabs[next]
              if (tab) {
                GlobalInstance.layoutOps?.makeTabActive(tab.id)
              }
            }
          }
        }
      },
      getRegisteredTabData: type => RegisterTabDataMap.get(type),
      initializeOneTab,
      registerTabData: tabData => {
        RegisterTabDataMap.set(tabData.type, tabData)
      },
      openNewTab: tabData => {
        const layout = layoutRef.current
        if (!layout) return
        const registeredData = RegisterTabDataMap.get(tabData.type)
        if (!registeredData) return
        const maybeExistTab = GlobalInstance.layoutOps?.hasTargetTab(tabData)
        if (maybeExistTab) {
          GlobalInstance.layoutOps?.makeTabActive(maybeExistTab)
          const targetTabData = LayoutIdToTabMap.get(maybeExistTab)
          if (targetTabData && 'instance' in targetTabData && targetTabData.instance) {
            tabData.onInstanceInitialized?.(targetTabData.instance)
            registeredData.onTabActive?.()
          }
          return
        }
        const initialized = initializeOneTab(registeredData, tabData)
        if (initialized) {
          const tabId = Id.getStrId()
          LayoutIdToTabMap.set(tabId, initialized)
          registeredData.onTabActive?.()
          addNewTab(
            {
              content: initialized.tabContent,
              id: tabId,
              title: 'New Tab',
              type: initialized.type,
              objectId: initialized.objectId,
              metaType: initialized.metaType
            },
            layout
          )
        }
      },
      hasTargetTab: tabData => {
        const { type, objectId, metaType } = tabData
        const target = Array.from(LayoutIdToTabMap.entries()).find(([k, v]) => {
          if (type === v.type) {
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
      },
      makeTabActive: tabId => {
        const layout = layoutRef.current
        if (!layout) return
        layout.updateTab(tabId, null, true)
      },
      closeAllTabs: keepHome => {
        LayoutIdToTabMap.clear()
        layoutRef.current?.changeLayout(defaultLayout)
        layoutRef.current?.setLayout(defaultLayout)
        if (keepHome) {
          Rendevoz.Actions.Open.openHome()
        }
      },
      closeCurrentFocusedPanel: () => {},
      closeCurrentFocusedTab: () => {
        const layout = layoutRef.current
        if (!layout) return
        const focusedTab = getCurrentFocusedTab(layout)
        if (focusedTab && focusedTab.id) {
          closeTab(focusedTab.id, layout)
        }
      }
    }
  })
}
