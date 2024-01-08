import { Icon, TabPane, Tabs } from '@/components'
import ClassName from '@/styles/classNames'
import { memo } from 'react'
import { Resizable } from 're-resizable'
import { useWhiteboardInstance } from '@/core/components/whiteboard/hooks/useWhiteboardInstance'
import { assignProperties } from '@/utils'
import { Rendevoz } from '@/core/rendevoz'
import { DockTabPaneContext } from '@/components/base/dock/DockTabPane'
import { atom, useAtom } from 'jotai'
import { IWhiteboardRightbarState } from '~/typings'
import { Colors } from '@/consts'
import WhiteboardContent from '@/core/components/whiteboard/sidebar/WhiteboardContent'
import { MetaStore } from '@/api/stores'
import { css } from '@emotion/css'

export const WhiteboardSidebarStateAtom = atom<IWhiteboardRightbarState>({ visible: false, width: '480px' })

const WhiteboardRightbar = () => {
  const [rightBarState, setRightBarState] = useAtom(WhiteboardSidebarStateAtom)
  const instance = useWhiteboardInstance()
  const { currentTab } = rightBarState
  const renderItem = (type: string, objectId?: number) => {
    if (!type || !objectId) return
    const page = Rendevoz.Actions.Layout.getRegisteredTabContent(type)
    if (page) {
      return (
        <div
          onWheelCapture={e => {
            e.stopPropagation()
          }}
          key={objectId}
          style={{ width: '100%', height: '100%' }}
        >
          <DockTabPaneContext.Provider value={{ currentTabId: '' }}>{page({ objectId })}</DockTabPaneContext.Provider>
        </div>
      )
    }
  }

  assignProperties(instance, {
    sidebarOps: {
      openRightBar: active => {
        setRightBarState(s => ({ ...s, active, visible: true }))
      },
      closeRightBar: () => {
        setRightBarState(s => ({ ...s, visible: false }))
      },
      openNodeAtSidebar: nodeId => {
        const node = instance.getNode?.(nodeId)
        if (node && node.type === 'metaObject') {
          const meta = MetaStore.getMetaObjectsMap().get(node.metaObjectId)
          console.log(meta)
          if (meta) {
            setRightBarState(s => ({
              ...s,
              active: 'content',
              visible: true,
              currentTab: {
                type: meta.type,
                objectId: meta.objectId
              }
            }))
          }
        }
      }
    },
    openTabInSidebar: (type, objectId) => {}
  })
  const { active, visible, width } = rightBarState
  console.log(width)
  // @ts-ignore
  return (
    <Resizable
      enable={{
        left: visible
      }}
      defaultSize={{
        width: '480px',
        height: '100%'
      }}
      onResizeStop={(event, direction, elementRef, delta) => {
        const width = elementRef.getBoundingClientRect().width
        setRightBarState(s => ({ ...s, width: `${width}px` }))
      }}
      minWidth={480}
      style={{
        boxShadow: 'var(--box-shadow)',
        position: 'absolute',
        transition: 'opacity 0.26s ease',
        opacity: visible ? 1 : 0,
        right: 0,
        top: 0,
        zIndex: 50,
        pointerEvents: visible ? 'auto' : 'none',
        background: Colors.Background.Popover,
        paddingTop: 42,
        '--global-background': 'var(--popover-background)',
        paddingLeft: 4
      }}
      className={
        !visible
          ? // @ts-ignore
            css({
              '*': {
                pointerEvents: 'none !important'
              }
            })
          : undefined
      }
    >
      {visible && (
        <Icon
          size={18}
          containerStyle={{
            position: 'absolute',
            top: 8,
            left: 8
          }}
          className={ClassName.flatButton(4, '5px')}
          onClick={() => {
            setRightBarState(s => ({ ...s, visible: false }))
          }}
          name={'park-double-right'}
        />
      )}
      <Tabs disableTabNav activeKey={active}>
        <TabPane tab={null} key={'content'}>
          {currentTab && renderItem(currentTab.type, currentTab.objectId)}
        </TabPane>
        <TabPane tab={null} key={'outline'}>
          <WhiteboardContent />
        </TabPane>
      </Tabs>
    </Resizable>
  )
}

export default memo(WhiteboardRightbar)
