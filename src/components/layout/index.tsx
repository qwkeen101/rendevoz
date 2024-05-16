import { memo, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Helmet } from 'react-helmet'
import { Container, Icon } from '../base'
import DockLayout, { LayoutData, TabData } from '../base/dock'
import { getSetting } from '@/core'
import { Sidebar } from './sidebar'
import ClassName from '@/styles/classNames'
import { ILayoutTab } from '~/typings'
import { Rendevoz } from '@/core/rendevoz'
import { getOS } from '@/App'
import TitleBar from '@/components/titlebar'
import * as Serializer from '../base/dock/Serializer'
import { GlobalInstance, useGlobalAtom } from '@/hooks'
import { atom } from 'jotai'
import assignGlobalLayoutOps from '@/components/layout/assignLayoutOps'
import registerTabs from '@/api/lifycycle/startup/registerTabs'
import GlobalStates from '@/api/global/states'

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
    currentFocusedPanelId: 'panel1',
    globalPanelExtra: () => (
      <div
        className={'transparent-font'}
        style={{
          height: '100%',
          padding: '0px 4px',
          display: 'flex',
          alignItems: 'center',
          zIndex: 10,
          pointerEvents: 'auto'
        }}
        draggable={false}
      >
        <Icon
          className={ClassName.circleButton()}
          name="park-plus"
          onClick={e => {
            e.stopPropagation()
            GlobalInstance.metaOps?.createObject().then(meta => {
              setTimeout(() => {
                Rendevoz.Actions.Open.Meta.openMetaObject(meta.id)
              }, 300)
            })
          }}
        />
      </div>
    )
  }
}

const restoreSavedTab = (tab: { type: string; objectId?: number; id: string; metaType?: string }) => {
  const { type, objectId, id, metaType } = tab
  const tabData = GlobalInstance.layoutOps?.getRegisteredTabData(type)
  if (!tabData) return
  const layoutTab = GlobalInstance.layoutOps?.initializeOneTab(tabData, { type, objectId, metaType })
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
      Rendevoz.Actions.Open.openHome()
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
      Rendevoz.Actions.Open.openHome()
      return
    }
    setTimeout(() => {
      const currentActiveTab = GlobalInstance.layoutOps?.getCurrentFocusedTab()
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
  return (
    <Container auto column style={{ height: '100vh', overflow: 'hidden' }}>
      <Helmet>
        <title>{currentActiveName}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Helmet>
      {os === 'windows' && <TitleBar />}
      <Container role={'body-container'} auto style={{ height: 0, overflow: 'clip' }}>
        <Sidebar direction={'right'} />
        <Container auto>
          {layout && (
            <DockLayout
              ref={layoutRef}
              style={{
                width: '100%',
                height: '100%'
              }}
              dropMode="edge"
              onLayoutChange={handleLayoutChange}
              layout={layout}
            ></DockLayout>
          )}
        </Container>
      </Container>
    </Container>
  )
}

export default memo(Layout)
