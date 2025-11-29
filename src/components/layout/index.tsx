import { memo, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Icon } from '../base'
import DockLayout, { LayoutData, TabData } from '../base/dock'
import { getSetting } from '@/core'
import ClassName from '@/styles/classNames'
import { ILayoutTab } from '~/typings'
import { getOS } from '@/App'
import TitleBar from '@/components/titlebar'
import * as Serializer from '../base/dock/Serializer'
import { useGlobalAtom } from '@/hooks'
import { atom } from 'jotai'
import assignGlobalLayoutOps from '@/components/layout/assignLayoutOps'
import registerTabs from '@/api/lifycycle/startup/registerTabs'
import GlobalStates from '@/api/global/states'
import SidebarPanel from '@/components/layout/sidebar/SidebarPanel'

const initialLayout: LayoutData = {
  global: {
    currentFocusedPanelId: 'panel1'
  },
  dockbox: {
    mode: 'horizontal',
    children: [
      {
        id: 'panel1',
        tabs: []
      }
    ]
  }
}

export const LayoutIdToTabMap = new Map<string, ILayoutTab>()
export const defaultLayout = {
  ...initialLayout,
  global: {
    currentFocusedPanelId: 'panel1'
  }
}

const restoreSavedTab = (tab: { type: string; objectId?: number; id: string }) => {
  const { type, objectId, id } = tab
  const tabData = Global.layoutOps?.getRegisteredTabData(type)
  if (!tabData) return
  const layoutTab = Global.layoutOps?.initializeOneTab(tabData, { type, objectId })
  if (layoutTab) {
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

export const GlobalLayoutAtom = atom(defaultLayout)
const Layout = () => {
  const [layout, setLayout] = useGlobalAtom(GlobalLayoutAtom)
  const layoutRef = useRef<DockLayout>()
  const [firstLayout] = useState(localStorage.getItem('layout'))
  assignGlobalLayoutOps(layoutRef)
  const loadTab = tab => {
    const restored = restoreSavedTab(tab)
    return restored || tab
  }
  const initialized = GlobalStates.useValue('initialized')
  useEffect(() => {
    if (initialized) {
      registerTabs()
      const setting = getSetting()
      if (setting.general.autoSaveLayout) {
        LayoutIdToTabMap.clear()
        const savedLayout = firstLayout
        if (savedLayout) {
          try {
            const parsed = JSON.parse(savedLayout)
            const after = {
              ...defaultLayout,
              ...Serializer.loadLayoutData(parsed, defaultLayout, loadTab)
            }
            setLayout(after)
            return
          } catch (e) {
            localStorage.removeItem('layout')
          }
        }
      }
    }
    setTimeout(() => {
      Global.layoutOps?.openPage('home')
    })
  }, [initialized])
  const handleLayoutChange = (layout: LayoutData) => {
    setLayout(layout)
    setTimeout(() => {
      localStorage.setItem('layout', JSON.stringify(layoutRef.current?.saveLayout()))
    })
  }
  const [currentActiveName, setCurrentActiveName] = useState('Rendevoz')
  useLayoutEffect(() => {
    if (layout.dockbox.children.length === 1 && layout.dockbox.children[0].tabs.length === 0) {
      Global.layoutOps?.openPage('home')
      return
    }
    setTimeout(() => {
      const currentActiveTab = Global.layoutOps?.getCurrentFocusedTab()
      if (currentActiveTab) {
        const tabInfo = layoutRef.current?.find(currentActiveTab) as TabData | undefined
        if (tabInfo) {
          if (typeof tabInfo.title === 'string') {
            setCurrentActiveName(tabInfo.title || 'Rendevoz')
            return
          }
        }
      }
      setCurrentActiveName('Rendevoz')
    })
  }, [layout])
  const os = getOS()
  useLayoutEffect(() => {
    document.title = currentActiveName
  }, [currentActiveName])
  const hasExtraPage = Global.layoutOps?.useExtraPage()
  console.log(hasExtraPage)
  return (
    <>
      {os === 'windows' && <TitleBar />}
      <SidebarPanel visible={!hasExtraPage} />
      {layout && (
        <DockLayout
          ref={layoutRef}
          style={{
            width: '100%',
            height: '100%',
            display: hasExtraPage ? 'none' : undefined
          }}
          dropMode="edge"
          onLayoutChange={handleLayoutChange}
          layout={layout}
        ></DockLayout>
      )}
    </>
  )
}

export default memo(Layout)
export { default as TabTitle } from './TabTitle'
