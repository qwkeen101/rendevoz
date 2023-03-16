import Actions from '@/Actions'
import useSidebarWidth from '@/hooks/components/useSidebarWidth'
import { LayoutFunctions } from '@/pdfViewer/core/layouts/Layout'
import { IPdfViewer } from '@/pdfViewer/core/types/pdfViewer'
import { FC, RefObject, useEffect, useMemo, useRef, useState } from 'react'
import { Helmet } from 'react-helmet'
import { Container } from '../base'
import DockLayout, { LayoutData, TabData } from '../base/dock'
import { CustomEditor } from '../editor/types'
import LayoutManager from './LayoutManager'

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
export type LayoutTab =
  | {
      type: 'pdf'
      objectId: number
      viewer?: IPdfViewer
    }
  | {
      type: 'note'
      objectId: number
      editor?: CustomEditor
    }
  | {
      type: 'home'
    }
  | {
      type: 'database'
    }
  | {
      type: 'whiteboard'
      objectId: number
    }
export const LayoutIdToTabMap = new Map<string, LayoutTab>()
export let GlobalLayout: LayoutManager | null = null
const Layout: FC<LayoutProps> = ({ sidebar }) => {
  const [sidebarWidth] = useSidebarWidth()
  const [layout, setLayout] = useState(initialLayout)
  const layoutManager = useMemo(() => new LayoutManager(), [])
  const layoutRef = useRef<DockLayout>()
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
    layoutManager.registerLayout(initialLayout)
    layoutManager.onLayoutChange(layout => {
      setLayout(layout)
    })
    Actions.openHome()
  }, [])
  const handleLayoutChange = (layout: LayoutData) => {
    setLayout(layout)
    layoutManager.registerLayout(layout)
    console.log(layout)
  }
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
              ref={layoutRef}
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
