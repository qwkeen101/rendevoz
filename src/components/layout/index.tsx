import { FC, useEffect, useMemo, useRef, useState } from 'react'
import { Helmet } from 'react-helmet'
import { Container, Icon } from '../base'
import DockLayout, { LayoutData } from '../base/dock'
import LayoutManager from './layoutManager'
import { css } from '@emotion/css'
import { getSetting, useCreateObject, useSetting } from '@/core'
import { useGlobalAtomValue } from '@/hooks'
import { SidebarStateAtom } from './sidebar'
import ClassName from '@/styles/classNames'
import { ILayoutTab } from '~/typings'
import { Rendevoz } from '@/core/rendevoz'
import { getOS } from '@/App'
import MacTitlebar from '@/components/titlebar/MacTitlebar'
import * as Algorithm from '../base/dock/Algorithm'
import * as Serializer from '../base/dock/Serializer'

interface LayoutProps {
  sidebar?: React.ReactNode
  children?: React.ReactNode
}

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
export let GlobalLayout: LayoutManager | null = null
const Layout: FC<LayoutProps> = ({ sidebar }) => {
  const sidebarWidth = useGlobalAtomValue(SidebarStateAtom).width

  const { portal, open } = useCreateObject({
    positions: ['bottom'],
    padding: 20,
    visiblities: {
      localFile: false
    }
  })
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
              console.log(e)
              open(e)
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
    console.log(restored)
    return restored || tab
  }
  layoutManager.makeTabActive = id => layoutRef.current?.updateTab(id, null, true)

  GlobalLayout = layoutManager

  useEffect(() => {
    const setting = getSetting()
    if (setting.general.autoSaveLayout) {
      const savedLayout = localStorage.getItem('layout')
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

    layoutManager.registerLayout(defaultLayout)
    layoutManager.onLayoutChange(layout => {
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
    <Container
      auto
      column
      className={css({
        '::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: `url(${setting.background.backgroundImage})`,
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
          opacity: setting.background.backgroundOpacity ?? 0.1,
          filter: setting.background.backgroundBlur ? `blur(${setting.background.backgroundBlur}px)` : undefined
        }
      })}
      style={{ height: '100vh', overflowY: 'auto' }}
    >
      {portal}
      <Helmet>
        <title>Rendevoz</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Helmet>
      {os === 'macos' && <MacTitlebar />}
      <Container auto style={{ height: 0 }}>
        {sidebar}
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

export default Layout
