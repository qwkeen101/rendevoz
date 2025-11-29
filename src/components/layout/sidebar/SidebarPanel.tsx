import { Resizable } from 're-resizable'
import { Icon, TabPane, Tabs } from '@/components'
import { createStore, Provider } from 'jotai'
import { Colors } from '@/consts'
import React, { memo, useMemo, useRef, useState } from 'react'
import { getOS } from '@/App'
import ClassName from '@/styles/classNames'
import useIsFullscreen from '@/hooks/utils/useIsFullscreen'
import SidebarCategory from '@/components/layout/sidebar/SidebarCategory'
import useSidebarState from '@/components/layout/sidebar/useSidebarState'
import updateSidebarState from '@/components/layout/sidebar/updateSidebarState'
import classnames from 'classnames'
import ChatPanel from '@/core/ai/chat/ChatPanel'
import UserService from '@/api/services/user.service'
import { GlobalSetting } from '@/core'
import CollapsedSidebar from '@/components/layout/sidebar/main'
import SidebarDatabase from '@/components/layout/sidebar/SidebarDatabase'
import { useSelectGlobalAtomValue } from '@/hooks'
import { assignProperties, pointInBox } from '@/utils'

const SidebarPanel = memo(({ visible }: { visible?: boolean }) => {
  const panelState = useSidebarState()
  const store = useMemo(() => createStore(), [])
  const realOpen = panelState.leftOpen
  const os = getOS()
  const width = panelState.leftWidth
  const fullScreen = useIsFullscreen(true)
  const enableHoveredSidebar = useSelectGlobalAtomValue(GlobalSetting.settingAtom, s => s.sidebar.hoveredSidebar)
  const [isResizing, setIsResizing] = useState(false)
  const [hovered, setHovered] = useState(false)
  const isPro = UserService.useIsUserPro(true)
  const buttonClass = ClassName.flatButton(6, '4px')
  const sidebarRef = useRef<HTMLDivElement>(null)
  assignProperties(Global, {
    layoutOps: {
      ...Global.layoutOps,
      closeFloatSidebar: () => {
        setHovered(false)
      },
      openFloatSidebar: () => {
        setHovered(true)
      }
    }
  })
  return (
    <div
      ref={sidebarRef}
      onPointerEnter={e => {
        if (enableHoveredSidebar) {
          setHovered(true)
        }
      }}
      onPointerLeave={e => {
        if (!e.currentTarget.contains(e.target)) return
        const bounding = e.currentTarget.getBoundingClientRect()
        if (
          !pointInBox(
            {
              x: e.clientX,
              y: e.clientY
            },
            bounding
          )
        ) {
          setHovered(false)
        }
      }}
      style={{
        zIndex: 100,
        transform: !realOpen ? (hovered ? undefined : 'translateX(calc(-100% + 8px))') : undefined,
        opacity: realOpen || hovered ? 1 : 0,
        position: realOpen ? 'relative' : 'absolute',
        flexShrink: 0,
        transition: !realOpen ? 'all 0.2s ease' : undefined,
        left: 0,
        bottom: 0,
        display: visible ? 'flex' : 'none',
        flexDirection: 'column',
        height: !realOpen ? 'calc(100% - 38px)' : '100%',
        justifyContent: 'center'
      }}
    >
      <Resizable
        defaultSize={{ width: 300, height: '100%' }}
        onResizeStart={() => setIsResizing(true)}
        size={{ width: width, height: '100%' }}
        minWidth={300}
        onResizeStop={(event, direction, elementRef) => {
          updateSidebarState(s => {
            s.leftWidth = elementRef.clientWidth
          })
          setIsResizing(false)
        }}
        handleStyles={{
          right: {
            transition: 'background 0.2s ease',
            backgroundColor: isResizing ? 'var(--select-color)' : undefined,
            width: 5
          }
        }}
        className={'flex flex-col'}
        enable={{ right: hovered || realOpen ? true : false }}
        maxHeight={!realOpen ? 'calc(100% - 100px)' : undefined}
        style={{
          boxShadow: !realOpen ? 'var(--popover-box-shadow)' : Colors.Consts.BoxShadowBorderRight,
          background: 'var(--sidebar-background)',
          borderRadius: !realOpen ? '0 0.75rem 0.75rem 0' : undefined
        }}
      >
        {realOpen && (
          <div
            style={{
              background: 'var(--tabs-bg)',
              height: 38,
              paddingTop: 3,
              paddingRight: 12,
              paddingLeft: os === 'macos' && !fullScreen ? 80 : 8,
              fontSize: 18,
              color: Colors.Font.Transparent,
              appRegion: 'drag',
              flexShrink: 0
            }}
            className={'flex gap-2 items-center'}
          >
            <Icon
              style={{
                appRegion: 'no-drag'
              }}
              name={'park-all-application'}
              onClick={() =>
                updateSidebarState(s => {
                  s.leftVisible = 'application'
                })
              }
              className={classnames(buttonClass, panelState.leftVisible === 'application' && 'active-button')}
            />
            <Icon
              style={{
                appRegion: 'no-drag'
              }}
              name={'custom-card-library'}
              onClick={() =>
                updateSidebarState(s => {
                  s.leftVisible = 'database'
                })
              }
              className={classnames(buttonClass, panelState.leftVisible === 'database' && 'active-button')}
            />
            <Icon
              style={{
                appRegion: 'no-drag'
              }}
              name={'park-category-management'}
              onClick={() =>
                updateSidebarState(s => {
                  s.leftVisible = 'category'
                })
              }
              className={classnames(buttonClass, panelState.leftVisible === 'category' && 'active-button')}
            />
            {isPro && (
              <Icon
                style={{
                  appRegion: 'no-drag'
                }}
                name={'park-communication'}
                onClick={() =>
                  updateSidebarState(s => {
                    s.leftVisible = 'chat'
                  })
                }
                className={classnames(buttonClass, panelState.leftVisible === 'chat' && 'active-button')}
              />
            )}
            <Icon
              onClick={() => {
                updateSidebarState(s => {
                  s.leftOpen = !s.leftOpen
                })
                if (realOpen) {
                  setTimeout(() => {
                    setHovered(false)
                  }, 300)
                }
              }}
              name={'custom-left-bar'}
              className={ClassName.flatButton(6, '4px 6px')}
              style={{
                marginLeft: 'auto',
                appRegion: 'no-drag'
              }}
            />
          </div>
        )}

        <Provider store={store}>
          <Tabs
            disableTabNav={true}
            activeKey={panelState.leftVisible}
            style={{
              zIndex: 10,
              height: 0,
              flex: 1
            }}
          >
            <TabPane className={'sidebar-font'} tab={null} key={'application'}>
              <CollapsedSidebar />
            </TabPane>
            <TabPane className={'sidebar-font'} tab={null} key="database">
              <SidebarDatabase visible={panelState.leftVisible === 'database'} />
            </TabPane>
            <TabPane className={'sidebar-font'} tab={null} key="category">
              <SidebarCategory />
            </TabPane>
            {isPro ? (
              <TabPane mount tab={null} key="chat">
                <ChatPanel />
              </TabPane>
            ) : null}
          </Tabs>
        </Provider>
      </Resizable>
    </div>
  )
})
export default SidebarPanel
