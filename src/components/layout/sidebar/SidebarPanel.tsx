import { useGlobalAtom } from '@/hooks'
import { SidebarPanelStateAtom } from '@/components/layout/sidebar/index'
import { ObjectPanel } from '@/core'
import { Hooks } from 'rendevoz'
import { Resizable } from 're-resizable'
import { Content, TabPane, Tabs } from '@/components'
import { createStore, Provider } from 'jotai'
import SidebarFolder from '@/components/layout/sidebar/SidebarFolder'
import { Colors } from '@/consts'
import { Rendevoz } from '@/core/rendevoz'
import { SearchPanel } from '@/core/global/GlobalSearchPanel'
import { useMemo } from 'react'
import produce from 'immer'
import { getOS } from '@/App'
const SidebarPanel = ({ direction, items }: { direction: 'right' | 'left'; items: string[] }) => {
  const [panelState, setPanelState] = useGlobalAtom(SidebarPanelStateAtom)
  const store = useMemo(() => createStore(), [])
  const realOpen = items.some(i => panelState.visible.has(i))
  const firstVisibleKey = items.find(i => panelState.visible.has(i))
  return (
    <Resizable
      defaultSize={{ width: 260, height: '100%' }}
      enable={{ right: direction === 'right', left: direction === 'left' }}
      style={{
        contentVisibility: realOpen ? 'visible' : 'hidden',
        position: realOpen ? 'relative' : 'absolute',
        borderRight: direction === 'right' ? `1px solid ${Colors.Background.Border}` : undefined,
        borderLeft: direction === 'left' ? `1px solid ${Colors.Background.Border}` : undefined,
        visibility: realOpen ? 'visible' : 'hidden',
        pointerEvents: realOpen ? 'auto' : 'none'
      }}
    >
      <Provider store={store}>
        <Tabs disableTabNav={true} activeKey={firstVisibleKey || 'none'}>
          {items.includes('database') ? (
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
                    padding={8}
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
          ) : null}
          {items.includes('collections') ? (
            <TabPane tab={null} key="collections">
              <SidebarFolder />
            </TabPane>
          ) : null}
          {items.includes('webSearch') ? (
            <TabPane tab={null} key="webSearch">
              <SearchPanel />
            </TabPane>
          ) : null}
        </Tabs>
      </Provider>
    </Resizable>
  )
}
export default SidebarPanel
