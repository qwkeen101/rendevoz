import { Resizable } from 're-resizable'
import { Content, Icon, TabPane, Tabs } from '@/components'
import { createStore, Provider } from 'jotai'
import SidebarFolder from '@/components/layout/sidebar/SidebarFolder'
import { Colors } from '@/consts'
import { SearchPanel } from '@/core/global/GlobalSearchPanel'
import React, { useMemo, useState } from 'react'
import { getOS } from '@/App'
import ClassName from '@/styles/classNames'
import useIsFullscreen from '@/hooks/utils/useIsFullscreen'
import SidebarCategory from '@/components/layout/sidebar/SidebarCategory'
import ObjectList from '@/core/object/ObjectList'
import useSidebarState from '@/components/layout/sidebar/useSidebarState'
import updateSidebarState from '@/components/layout/sidebar/updateSidebarState'
const SidebarPanel = ({ direction }: { direction: 'right' | 'left' }) => {
  const panelState = useSidebarState()
  const store = useMemo(() => createStore(), [])
  const realOpen = panelState.leftOpen
  const os = getOS()
  const width = panelState.leftWidth
  const fullScreen = useIsFullscreen(true)
  const [isResizing, setIsResizing] = useState(false)
  return (
    <Resizable
      defaultSize={{ width: 260, height: '100%' }}
      onResizeStart={() => setIsResizing(true)}
      size={{ width: realOpen ? width : 0, height: '100%' }}
      minWidth={realOpen ? 240 : 0}
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
      enable={{ right: direction === 'right', left: direction === 'left' }}
      style={{
        contentVisibility: realOpen ? 'visible' : 'hidden',
        position: realOpen ? 'relative' : 'absolute',
        boxShadow: direction === 'right' ? Colors.Consts.BoxShadowBorderRight : undefined,
        borderLeft: direction === 'left' ? `1px solid ${Colors.Background.Border}` : undefined,
        visibility: realOpen ? 'visible' : 'hidden',
        pointerEvents: realOpen ? 'auto' : 'none',
        background: Colors.Background.Secondary
      }}
    >
      <Content
        flex
        gap={6}
        style={{
          background: 'var(--tabs-bg)',
          height: 38,
          paddingTop: 3,
          paddingRight: 12,
          paddingLeft: os === 'macos' && !fullScreen ? 40 : 8,
          fontSize: 18,
          marginRight: 1,
          color: Colors.Font.Transparent,
          borderBottom: `1px solid ${Colors.Background.BoxShadowBorder}`
        }}
        alignItems={'center'}
      >
        <Icon
          name={'park-data'}
          data-active={panelState.leftVisible === 'database'}
          onClick={() =>
            updateSidebarState(s => {
              s.leftVisible = 'database'
            })
          }
          className={ClassName.flatButton(4, '4px 6px')}
        />
        <Icon
          name={'park-folder-close'}
          data-active={panelState.leftVisible === 'collections'}
          onClick={() =>
            updateSidebarState(s => {
              s.leftVisible = 'collections'
            })
          }
          className={ClassName.flatButton(4, '4px 6px')}
        />
        <Icon
          name={'park-category-management'}
          data-active={panelState.leftVisible === 'category'}
          onClick={() =>
            updateSidebarState(s => {
              s.leftVisible = 'category'
            })
          }
          className={ClassName.flatButton(4, '4px 6px')}
        />
        <Icon
          name={'park-google'}
          data-active={panelState.leftVisible === 'webSearch'}
          onClick={() =>
            updateSidebarState(s => {
              s.leftVisible = 'webSearch'
            })
          }
          className={ClassName.flatButton(4, '4px 6px')}
        />
        <Icon
          onClick={() =>
            updateSidebarState(s => {
              s.leftOpen = !s.leftOpen
            })
          }
          name={'custom-left-bar'}
          className={ClassName.flatButton(4, '4px 6px')}
          style={{
            marginLeft: 'auto'
          }}
        />
      </Content>

      <Provider store={store}>
        <Tabs disableTabNav={true} activeKey={panelState.leftVisible}>
          <TabPane tab={null} key="database">
            <Content fullHeight fullWidth flex column>
              <Provider store={store}>
                <ObjectList renderFilterOnParent={false} padding={'8px 8px 4px'} />
              </Provider>
            </Content>
          </TabPane>
          <TabPane tab={null} key="collections">
            <SidebarFolder />
          </TabPane>
          <TabPane tab={null} key="webSearch">
            <SearchPanel />
          </TabPane>
          <TabPane tab={null} key="category">
            <SidebarCategory />
          </TabPane>
        </Tabs>
      </Provider>
    </Resizable>
  )
}
export default SidebarPanel
