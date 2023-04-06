import { Content, Icon } from '@/components'
import DockLayout, { LayoutData, PanelData } from '@/components/base/dock'
import { useToggle } from '@/hooks'
import EditorPage from '@/scenes/editor'
import PdfPage from '@/scenes/pdf'
import ClassName from '@/styles/classNames'
import Id from '@/utils/id'
import * as Algorithm from '@/components/base/dock/Algorithm'
import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Rnd } from 'react-rnd'

const useWhiteboardSidebar = () => {
  const [collapsed, toggleCollapsed] = useToggle(false)
  const id = useMemo(() => Id.getStrId(), [])
  const [x, setX] = useState(-600)
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
    }
  }
  useLayoutEffect(() => {
    if (collapsed) {
      toggleShowTransition(true)
    } else {
      setTimeout(() => toggleShowTransition(false), 200)
    }
  }, [collapsed])

  const addTab = (type: 'pdf' | 'note' | 'webpage', objectId: number) => {
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
  const render = () => {
    return (
      <Rnd
        enableResizing={{ left: collapsed ? false : true }}
        disableDragging
        default={{
          height: '100%',
          width: '600px',
          x: -600,
          y: 0
        }}
        onResizeStop={(e, dir, ele, delta, pos) => {
          setX(-ele.getBoundingClientRect().width)
        }}
        position={{
          y: 0,
          x: collapsed ? 0 : layout.dockbox.children[0].tabs.length > 0 ? x : 0
        }}
        style={{ transition: showTransition ? 'transform 0.2s ease' : undefined, borderLeft: '1px solid rgba(0,0,0,0.08)' }}
      >
        {layout.dockbox.children[0].tabs.length > 0 && (
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: -40, display: 'flex', alignItems: 'center' }}>
            <Icon className={ClassName.circleButton()} size={24} name={collapsed ? 'park-left' : 'park-right'} onClick={toggleCollapsed} />
          </div>
        )}
        <div className={ClassName.Background.blurBackground} style={{ position: 'absolute', top: 0, left: 0, bottom: 0, right: 0 }}></div>
        <Content
          onWheelCapture={e => e.stopPropagation()}
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
      </Rnd>
    )
  }

  return {
    addTab,
    render
  }
}

export default useWhiteboardSidebar
