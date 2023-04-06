import { ReactNode, useContext, useLayoutEffect } from 'react'
import { DockTabPaneContext } from '../base/dock/DockTabPane'
import { DockContextType, TabData } from '../base/dock'

const TabTitle = ({ title, disable, icon }: { title: string; disable?: boolean; icon?: ReactNode }) => {
  const tabPaneContext = useContext(DockTabPaneContext)
  const dockContext = useContext(DockContextType)
  useLayoutEffect(() => {
    if (!disable) {
      const currentTabId = tabPaneContext?.currentTabId
      if (currentTabId) {
        const tab = dockContext.find(currentTabId) as TabData | undefined
        if (tab?.id) {
          dockContext.updateTab(
            tab.id,
            {
              ...tab,
              title,
              icon
            },
            false
          )
        }
      }
    }
  }, [title, icon])
  return null
}

export default TabTitle
