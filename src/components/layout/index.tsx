import useEventEmitter from '@/events/useEventEmitter'
import useSidebarWidth from '@/hooks/components/useSidebarWidth'
import { LayoutFunctions } from '@/pdfViewer/core/layouts/Layout'
import Id from '@/utils/id'
import { FC, RefObject, useEffect, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet'
import { useLocation } from 'react-router-dom'
import { Container } from '../base'
import DockLayout, { LayoutData } from '../base/dock'
import { DockTabPaneContext } from '../base/dock/DockTabPane'
import LayoutManager from './layoutManager'
import routeToComponent from './routeToComponent'

interface LayoutProps {
  sidebar?: React.ReactNode
  children?: React.ReactNode
}

const initialLayout: LayoutData = {
  global: {
    globalPanelExtra: () => <div></div>,
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

export type PdfInstance = {
  pdfId: number
  createdAt: number
  viewerRef: RefObject<LayoutFunctions>
}

export class GlobalInstances {
  static pdfInstances: PdfInstance[] = []
}

export let GlobalLayout: LayoutManager | null = null
const Layout: FC<LayoutProps> = ({ sidebar }) => {
  const [sidebarWidth] = useSidebarWidth()
  const [layout, setLayout] = useState(initialLayout)
  const location = useLocation()
  const layoutManager = useMemo(() => new LayoutManager(), [])
  const emitter = useEventEmitter()
  GlobalLayout = layoutManager

  useEffect(() => {
    layoutManager.registerEmitter(emitter)
    layoutManager.registerLayout(initialLayout)
    layoutManager.onLayoutChange(layout => {
      setLayout(layout)
    })
  }, [])
  const handleLayoutChange = (layout: LayoutData) => {
    setLayout(layout)
    layoutManager.registerLayout(layout)
  }
  useEffect(() => {
    const component = routeToComponent(location.pathname, location.search)
    if (component) {
      const id = Id.getStrId()
      const newLayout = layoutManager.registerNewTab({
        content: (
          <DockTabPaneContext.Provider value={{ currentTabId: id }}>
            <div style={{ width: '100%', height: '100%', overflow: 'hidden' }} key={id}>
              {component}
            </div>
          </DockTabPaneContext.Provider>
        ),
        title: location.pathname,
        id
      })
      newLayout && setLayout(newLayout)
    }
  }, [location])
  return (
    <Container auto column style={{ height: '100vh', overflowY: 'auto' }}>
      <Helmet>
        <title>Rendevoz</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Helmet>
      <Container auto>
        {sidebar}
        <Container style={{ marginLeft: sidebarWidth, transition: 'margin-left 0.3s ease-out' }} auto>
          {layout && (
            <DockLayout
              style={{
                position: 'absolute',
                inset: 0
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
