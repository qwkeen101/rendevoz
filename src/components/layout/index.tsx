import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { Helmet } from 'react-helmet'
import { Container, Icon } from '../base'
import DockLayout, { LayoutData } from '../base/dock'
import LayoutManager from './layoutManager'
import { getSetting, useSetting } from '@/core'
import { Sidebar } from './sidebar'
import ClassName from '@/styles/classNames'
import { ILayoutTab } from '~/typings'
import { Rendevoz } from '@/core/rendevoz'
import { getOS } from '@/App'
import TitleBar from '@/components/titlebar'
import MacTitlebar from '@/components/titlebar/MacTitlebar'
import * as Serializer from '../base/dock/Serializer'
import { GlobalInstance, useGlobalAtom, useGlobalAtomValue } from '@/hooks'
import { initializedAtom } from '@/Initializer'
import { atom, useAtom } from 'jotai'

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

const firstLayout = localStorage.getItem('layout')
export const LayoutIdToTabMap = new Map<string, ILayoutTab>()
export let GlobalLayout: LayoutManager | null = null
export const defaultLayout = {
  ...initialLayout,
  global: {
    currentFocusedPanelId: 'panel1',
    globalPanelExtra: () => (
      <div
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
export const GlobalLayoutAtom = atom(defaultLayout)
const Layout = () => {
  const [layout, setLayout] = useGlobalAtom(GlobalLayoutAtom)
  const layoutManager = useMemo(() => new LayoutManager(), [])
  const layoutRef = useRef<DockLayout>()

  const loadTab = tab => {
    const restored = Rendevoz.Actions.Layout.restoreSavedTab(tab)
    return restored || tab
  }
  layoutManager.makeTabActive = id => layoutRef.current?.updateTab(id, null, true)

  GlobalLayout = layoutManager
  const initialized = useGlobalAtomValue(initializedAtom)
  useEffect(() => {
    if (initialized) {
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
            layoutManager.onLayoutChange(layout => {
              setLayout(layout)
            })
            layoutManager.registerLayout(after)
            return
          } catch (e) {
            localStorage.removeItem('layout')
          }
        }
      }
    }
    layoutManager.registerLayout(defaultLayout)
    layoutManager.onLayoutChange(layout => {
      setLayout(layout)
    })
    setTimeout(() => {
      Rendevoz.Actions.Open.openHome()
    })
  }, [initialized])
  const handleLayoutChange = (layout: LayoutData) => {
    setLayout(layout)
    layoutManager.registerLayout(layout)
    setTimeout(() => {
      localStorage.setItem('layout', JSON.stringify(layoutRef.current?.saveLayout()))
    })
  }

  const os = getOS()
  return (
    <Container onClick={() => { console.log(layout)}}auto column style={{ height: '100vh', overflow: 'hidden' }}>
      <Helmet>
        <title>Rendevoz</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Helmet>
      {os === 'windows' && <TitleBar />}
      {/*{os === 'macos' && <MacTitlebar />}*/}
      <Container role={'body-container'} auto style={{ height: 0 }}>
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
