import { Icon } from '@/components'
import { useToggle } from '@/hooks'
import ClassName from '@/styles/classNames'
import { useLayoutEffect, useState } from 'react'
import { Resizable } from 're-resizable'
import { useWhiteboardInstance } from '@/core/whiteboard/hooks/useWhiteboardInstance'
import { assignProperties } from '@/utils'
import { Rendevoz } from '@/core/rendevoz'
import { DockTabPaneContext } from '@/components/base/dock/DockTabPane'

const useWhiteboardSidebar = () => {
  const [collapsed, toggleCollapsed] = useToggle(true)
  const instance = useWhiteboardInstance()
  const [currentTab, setCurrentTab] = useState<{
    type: string
    objectId?: number
  }>()
  const renderItem = (type: string, objectId?: number) => {
    if (!type || !objectId) return
    const page = Rendevoz.Actions.Layout.getRegisteredTabContent(type)
    if (page) {
      return (
        <div
          onWheelCapture={e => {
            e.stopPropagation()
          }}
          style={{ width: '100%', height: '100%' }}
        >
          <DockTabPaneContext.Provider value={{ currentTabId: '' }}>{page({ objectId })}</DockTabPaneContext.Provider>
        </div>
      )
    }
  }

  assignProperties(instance, {
    openTabInSidebar: (type, objectId) => {
      console.log('togghe here')
      setCurrentTab({
        type,
        objectId
      })
      toggleCollapsed(false)
    }
  })

  const realCollapsed = collapsed || !currentTab
  const render = () => {
    return (
      <Resizable
        enable={{
          left: realCollapsed ? false : true
        }}
        defaultSize={{
          height: '100%',
          width: 600
        }}
        minWidth={480}
        style={{
          boxShadow: 'var(--box-shadow)',
          transform: realCollapsed ? 'translateX(100%)' : 'translateX(0px)',
          position: 'absolute',
          right: 0,
          top: 0,
          zIndex: 50
        }}
      >
        {currentTab && (
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
              name={realCollapsed ? 'park-left' : 'park-right'}
              onClick={toggleCollapsed}
            />
          </div>
        )}

        <div className={ClassName.Background.blurBackground} style={{ position: 'absolute', top: 0, left: 0, bottom: 0, right: 0 }}></div>
        {currentTab && renderItem(currentTab.type, currentTab.objectId)}
      </Resizable>
    )
  }

  return {
    render
  }
}

export default useWhiteboardSidebar
