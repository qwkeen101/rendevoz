import { useGlobalAtom } from '@/hooks'
import { SidebarPanelStateAtom } from '@/components/layout/sidebar/index'
import { ObjectPanel } from '@/core'
import { Hooks } from 'rendevoz'
import { Resizable } from 're-resizable'
import { Content, TabPane, Tabs } from '@/components'
import { Provider } from 'jotai'
import SidebarFolder from '@/components/layout/sidebar/SidebarFolder'
import { Colors } from '@/consts'
import { Rendevoz } from '@/core/rendevoz'
import { SearchPanel } from '@/core/global/GlobalSearchPanel'

const SidebarPanel = () => {
  const [panelState, setPanelState] = useGlobalAtom(SidebarPanelStateAtom)
  const store = Hooks.globalStore
  console.log(panelState)
  return (
    <Resizable
      defaultSize={{ width: 260, height: '100%' }}
      enable={{ right: true }}
      style={{
        contentVisibility: panelState.open ? 'visible' : 'hidden',
        position: panelState.open ? 'relative' : 'absolute',
        transform: panelState.open ? 'translateX(0px)' : 'translateX(-100%)',
        borderRight: `1px solid ${Colors.Background.Border}`
      }}
    >
      <Provider store={store}>
        <Tabs disableTabNav={true} activeKey={panelState.visible || 'none'}>
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
                  padding={8}
                  onOpenInTab={() => {
                    Rendevoz.Actions.Open.openDatabase()
                  }}
                  onClose={() => {
                    setPanelState(s => ({ ...s, open: false }))
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
        </Tabs>
      </Provider>
    </Resizable>
  )
}
export default SidebarPanel
