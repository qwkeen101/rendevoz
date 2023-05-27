import Actions from '@/core/Actions'
import useSidebarWidth from '@/hooks/components/useSidebarWidth'
import { FC, useEffect, useMemo, useRef, useState } from 'react'
import { Helmet } from 'react-helmet'
import { Container, Icon } from '../base'
import DockLayout, { LayoutData } from '../base/dock'
import LayoutManager from './LayoutManager'
import { css } from '@emotion/css'
import { useCreateObject, useSetting } from '@/core'
import { LayoutTab } from './types'
import { useGlobalAtomValue } from '@/hooks'
import { SidebarStateAtom } from './sidebar'
import ClassName from '@/styles/classNames'
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

export const LayoutIdToTabMap = new Map<string, LayoutTab>()
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
            pointerEvents: 'auto',
          }}
          draggable={false}
        >
          <Icon
            className={ClassName.circleButton()}
            name="park-plus"
            onClick={e => {
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
  layoutManager.makeTabActive = id => layoutRef.current?.updateTab(id, null, true)
  layoutManager.hasTargetTab = tab => {
    const target = Array.from(LayoutIdToTabMap.entries()).find(([k, v]) => {
      if (tab.type === v.type) {
        if ('objectId' in v && 'objectId' in tab) {
          if (v.objectId === tab.objectId) {
            return k
          }
          return
        }
        return k
      }
    })

    return target?.[0]
  }
  GlobalLayout = layoutManager

  useEffect(() => {
    layoutManager.registerLayout(defaultLayout)
    layoutManager.onLayoutChange(layout => {
      setLayout(layout)
    })
    Actions.openHome()
  }, [])
  const handleLayoutChange = (layout: LayoutData) => {
    setLayout(layout)
    layoutManager.registerLayout(layout)
  }
  const resolvedBgUrl = useMemo(() => {
    // if (setting.background.backgroundImage?.startsWith('rendefile')) {
    //   return setting.background.backgroundImage.replace('rendefile', 'file').replaceAll('\\', '/')
    // }
    return setting.background.backgroundImage
  }, [setting.background.backgroundImage])
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
          backgroundImage: `url(${resolvedBgUrl})`,
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
      <Container auto>
        {sidebar}
        <Container style={{ marginLeft: sidebarWidth, transition: 'margin-left 0.3s ease-out' }} auto>
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
