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
import { GlobalInstance, useGlobalAtomValue } from '@/hooks'
import { initializedAtom } from '@/Initializer'

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
let recovered = false
const firstLayout = localStorage.getItem('layout')
export const LayoutIdToTabMap = new Map<string, ILayoutTab>()
export let GlobalLayout: LayoutManager | null = null
const Layout = () => {
  const defaultLayout = {
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
  const [layout, setLayout] = useState(defaultLayout)
  const layoutManager = useMemo(() => new LayoutManager(), [])
  const layoutRef = useRef<DockLayout>()
  const [setting] = useSetting()
  const loadTab = tab => {
    const restored = Rendevoz.Actions.Layout.restoreSavedTab(tab)
    return restored || tab
  }
  layoutManager.makeTabActive = id => layoutRef.current?.updateTab(id, null, true)

  GlobalLayout = layoutManager
  const initialized = useGlobalAtomValue(initializedAtom)
  useEffect(() => {
    if (initialized) {
      if (!recovered) {
        recovered = true
        const setting = getSetting()
        if (setting.general.autoSaveLayout) {
          LayoutIdToTabMap.clear()
          const savedLayout = firstLayout
          if (savedLayout) {
            const parsed = JSON.parse(savedLayout)
            const after = {
              ...defaultLayout,
              ...Serializer.loadLayoutData(parsed, defaultLayout, loadTab)
            }

            setLayout(after)
            layoutManager.registerLayout(after)
            layoutManager.onLayoutChange(layout => {
              setLayout(layout)
            })
            return
          }
        }
      }
    }
  }, [initialized])
  useEffect(() => {
    layoutManager.registerLayout(defaultLayout)
    layoutManager.onLayoutChange(layout => {
      console.log(layout)
      setLayout(layout)
    })
    setTimeout(() => {
      Rendevoz.Actions.Open.openHome()
    })
  }, [])
  const handleLayoutChange = (layout: LayoutData) => {
    setLayout(layout)
    layoutManager.registerLayout(layout)
    localStorage.setItem('layout', JSON.stringify(layoutRef.current?.saveLayout()))
  }

  const os = getOS()
  return (
    <Container auto column style={{ height: '100vh', overflow: 'hidden' }}>
      <Helmet>
        <title>Rendevoz</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Helmet>
      {/*{os === 'windows' && <TitleBar />}*/}
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
