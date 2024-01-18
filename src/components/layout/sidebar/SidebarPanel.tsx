import { useGlobalAtom } from '@/hooks'
import { SidebarPanelStateAtom } from '@/components/layout/sidebar/index'
import { ObjectPanel } from '@/core'
import { Resizable } from 're-resizable'
import { Content, Icon, TabPane, Tabs } from '@/components'
import { createStore, Provider } from 'jotai'
import SidebarFolder from '@/components/layout/sidebar/SidebarFolder'
import { Colors } from '@/consts'
import { Rendevoz } from '@/core/rendevoz'
import { SearchPanel } from '@/core/global/GlobalSearchPanel'
import React, { useMemo, useState } from 'react'
import produce from 'immer'
import { getOS } from '@/App'
import ClassName from '@/styles/classNames'
import useIsFullscreen from '@/hooks/utils/useIsFullscreen'
import SidebarCategory from '@/components/layout/sidebar/SidebarCategory'
const SidebarPanel = ({ direction }: { direction: 'right' | 'left' }) => {
  const [panelState, setPanelState] = useGlobalAtom(SidebarPanelStateAtom)
  const store = useMemo(() => createStore(), [])
  const realOpen = panelState.leftOpen
  const os = getOS()
  const [width, setWidth] = useState(240)
  const fullScreen = useIsFullscreen(true)
  return (
    <Resizable
      defaultSize={{ width: 260, height: '100%' }}
      size={{ width: realOpen ? width : 0, height: '100%' }}
      minWidth={realOpen ? 240 : 0}
      onResizeStop={(event, direction, elementRef, delta) => {
        setWidth(elementRef.clientWidth)
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
          data-active={panelState.visible.has('database')}
          onClick={() => {
            setPanelState(s =>
              produce(s, draft => {
                draft.visible.clear()
                draft.visible.add('database')
              })
            )
          }}
          className={ClassName.flatButton(4, '4px 6px')}
        />
        <Icon
          name={'park-folder-close'}
          data-active={panelState.visible.has('collections')}
          onClick={() => {
            setPanelState(s =>
              produce(s, draft => {
                draft.visible.clear()
                draft.visible.add('collections')
              })
            )
          }}
          className={ClassName.flatButton(4, '4px 6px')}
        />
        <Icon
          name={'park-category-management'}
          data-active={panelState.visible.has('category')}
          onClick={() => {
            setPanelState(s =>
              produce(s, draft => {
                draft.visible.clear()
                draft.visible.add('category')
              })
            )
          }}
          className={ClassName.flatButton(4, '4px 6px')}
        />
        <Icon
          name={'park-google'}
          data-active={panelState.visible.has('webSearch')}
          onClick={() => {
            setPanelState(s =>
              produce(s, draft => {
                draft.visible.clear()
                draft.visible.add('webSearch')
              })
            )
          }}
          className={ClassName.flatButton(4, '4px 6px')}
        />
        <Icon
          onClick={() => {
            setPanelState(s =>
              produce(s, draft => {
                draft.leftOpen = false
              })
            )
          }}
          name={'custom-left-bar'}
          className={ClassName.flatButton(4, '4px 6px')}
          style={{
            marginLeft: 'auto'
          }}
        />
      </Content>

      <Provider store={store}>
        <Tabs disableTabNav={true} activeKey={panelState.visible.keys().next().value || 'none'}>
          <TabPane tab={null} key="database">
            <Content
              fullHeight
              fullWidth
              flex
              column
              style={{
                transform: panelState.showObjectDetails ? 'translateX(-100%)' : 'translateX(0px)',
                transition: 'transform 0.3s ease'
              }}
            >
              <Provider store={store}>
                <ObjectPanel
                  renderFilterOnParent={false}
                  padding={'8px 8px 4px'}
                  onOpenInTab={() => {
                    Rendevoz.Actions.Open.openDatabase()
                  }}
                  onClose={() => {
                    setPanelState(s =>
                      produce(s, draft => {
                        draft.visible.delete('database')
                      })
                    )
                  }}
                  visiblility={{
                    showClose: false,
                    showCurrentTabObject: true,
                    showOpenInTab: true
                  }}
                  onBackToList={() => setPanelState(s => ({ ...s, showObjectDetails: undefined }))}
                  showObjectDetails={panelState.showObjectDetails ? { id: panelState.showObjectDetails.id } : undefined}
                  isAddingObject={false}
                  handleAddObject={() => {}}
                />
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
