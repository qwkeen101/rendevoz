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
import { useWhiteboardInstance } from '@/core/whiteboard/hooks/useWhiteboardInstance'
import { assignProperties } from '@/utils'
import { useLatest } from 'react-use'

const useWhiteboardSidebar = () => {
  const [collapsed, toggleCollapsed] = useToggle(true)
  const id = useMemo(() => Id.getStrId(), [])
  const [showTransition, toggleShowTransition] = useState(false)
  const layoutRef = useRef<DockLayout>()
  const instance = useWhiteboardInstance()
  const objectIdToInstanceMap = useRef(new Map<number, any>())
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
  const latestLayout = useLatest(layout)
  const renderItem = (type: string, objectId: number) => {
    if (!type || !objectId) return
    switch (type) {
      case 'note':
        return <EditorPage id={id} noteId={objectId} onInstanceInitialized={i => objectIdToInstanceMap.current.set(objectId, i)} />
      case 'pdf':
        return <PdfPage pdfId={objectId} onInstanceInitialized={i => objectIdToInstanceMap.current.set(objectId, i)} />
      case 'image':
        return <ImagePage imageId={objectId} />
      case 'video':
        return <VideoPage videoId={objectId} onInstanceInitialized={i => objectIdToInstanceMap.current.set(objectId, i)} />
      case 'webpage':
        return (
          <Webpage
            onWebpageChange={w => {
              const oldObjectId = w.oldWebpageId
              if (!oldObjectId) return
              const currentLayout = latestLayout.current
              const maybeTab = (currentLayout.dockbox.children[0] as PanelData).tabs.find(
                i => i.objectId === oldObjectId || i.objectId === objectId
              )

              if (maybeTab) {
                layoutRef.current?.updateTab(maybeTab.id, { ...maybeTab, objectId: w.webpageId }, false)
              }
              console.log(maybeTab, oldObjectId, w.webpageId, currentLayout)
              const originInstance = objectIdToInstanceMap.current.get(oldObjectId)
              if (originInstance) {
                objectIdToInstanceMap.current.delete(oldObjectId)
                objectIdToInstanceMap.current.set(w.webpageId, originInstance)
              }
            }}
            initialWebpageId={objectId}
            onInstanceInitialized={i => objectIdToInstanceMap.current.set(objectId, i)}
          />
        )
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
  assignProperties(instance, {
    openTabInSidebar: tabData => {
      const maybeTab = (layout.dockbox.children[0] as PanelData).tabs.find(i => i.objectId === tabData.objectId)
      console.log(maybeTab, tabData)
      if (maybeTab) {
        layoutRef.current?.updateTab(maybeTab.id, null, true)
        const instance = objectIdToInstanceMap.current.get(tabData.objectId)
        if (instance) {
          tabData.onInstanceInitialized?.(instance)
        }
        toggleCollapsed(false)
        return maybeTab
      } else {
        return undefined
      }
    }
  })
  useEffect(() => {
    if (layout.dockbox.children[0].tabs.length === 0) {
      toggleCollapsed(true)
    }
    const allObjectIds = layout.dockbox.children[0].tabs.map(i => i.objectId) as number[]
    objectIdToInstanceMap.current.forEach((i, key) => {
      if (!allObjectIds.includes(key)) {
        objectIdToInstanceMap.current.delete(key)
      }
    })
  }, [layout.dockbox.children[0].tabs.length])
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
          top: 0,
          zIndex: 50
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
              alignItems: 'center',
              pointerEvents: 'none'
            }}
          >
            <Icon
              className={ClassName.circleButton()}
              containerStyle={{ pointerEvents: 'auto' }}
              size={24}
              name={collapsed ? 'park-left' : 'park-right'}
              onClick={toggleCollapsed}
            />
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
