import { Content, Icon } from '@/components'
import DockLayout, { LayoutData, PanelData } from '@/components/base/dock'
import { useToggle } from '@/hooks'
import EditorPage from '@/scenes/editor'
import PdfPage from '@/scenes/pdf'
import ClassName from '@/styles/classNames'
import Id from '@/utils/id'
import * as Algorithm from '@/components/base/dock/Algorithm'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import ImagePage from '@/scenes/ImagePage'
import Webpage from '../webpage/Webpage'
import { Resizable } from 're-resizable'
import VideoPage from '@/scenes/VideoPage'

const useWhiteboardSidebar = () => {
  const [collapsed, toggleCollapsed] = useToggle(true)
  const id = useMemo(() => Id.getStrId(), [])
  const [showTransition, toggleShowTransition] = useState(false)
  const layoutRef = useRef<DockLayout>()
  const [layout, setLayout] = useState<LayoutData>({
    global: {
      currentFocusedPanelId: 'panel1',
      disableDrag: true
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
  })
  const renderItem = (type: string, objectId: number) => {
    if (!type || !objectId) return
    switch (type) {
      case 'note':
        return <EditorPage id={id} noteId={objectId} />
      case 'pdf':
        return <PdfPage pdfId={objectId} />
      case 'image':
        return <ImagePage imageId={objectId} />
      case 'video':
        return <VideoPage videoId={objectId} />
      case 'webpage':
        return <Webpage initialWebpageId={objectId} />
    }
  }
  useLayoutEffect(() => {
    if (collapsed) {
      toggleShowTransition(true)
    } else {
      setTimeout(() => toggleShowTransition(false), 200)
    }
  }, [collapsed])

  const addTab = (type: 'pdf' | 'note' | 'webpage' | 'video' | 'image', objectId: number) => {
    if (type && objectId) {
      toggleCollapsed(false)
      const layout = layoutRef.current?.getLayout()
      if (!layout) return
      const maybeTab = (layout.dockbox.children[0] as PanelData).tabs.find(i => i.objectId === objectId)
      if (maybeTab) {
        layoutRef.current?.updateTab(maybeTab.id, null, true)
      } else {
        const layout = layoutRef.current?.getLayout()
        const nextLayout = Algorithm.addTabToPanel(
          layout,
          {
            content: renderItem(type, objectId),
            id: Id.getStrId(),
            title: 'New Tab',
            objectId
          },
          layout?.dockbox.children[0]
        )
        setLayout(nextLayout)
      }
    }
  }
  useEffect(() => {
    if(layout.dockbox.children[0].tabs.length === 0){
      toggleCollapsed(true)
    }
  },[layout.dockbox.children[0].tabs.length])
  const render = () => {
    return (
      <Resizable
        enable={{
          left: collapsed ? false : true
        }}
        defaultSize={{
          height: '100%',
          width: 600
        }}
        minWidth={480}
        style={{
          borderLeft: '1px solid rgba(0,0,0,0.08)',
          transform: collapsed ? 'translateX(100%)' : 'translateX(0px)',
          position: 'absolute',
          right: 0,
          top: 0
        }}
      >
        {layout.dockbox.children[0].tabs.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: -40,
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Icon className={ClassName.circleButton()} size={24} name={collapsed ? 'park-left' : 'park-right'} onClick={toggleCollapsed} />
          </div>
        )}
        <div className={ClassName.Background.blurBackground} style={{ position: 'absolute', top: 0, left: 0, bottom: 0, right: 0 }}></div>
        <Content
          onWheel={e => e.stopPropagation()}
          onKeyDown={e => {
            e.stopPropagation()
          }}
          fullHeight
        >
          <DockLayout
            layout={layout}
            onLayoutChange={l => setLayout(l)}
            ref={layoutRef}
            style={{ position: 'absolute', inset: 0 }}
          ></DockLayout>
        </Content>
      </Resizable>
    )
  }

  return {
    addTab,
    render
  }
}

export default useWhiteboardSidebar
