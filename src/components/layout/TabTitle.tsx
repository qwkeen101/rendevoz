import { ReactNode, useContext, useLayoutEffect } from 'react'
import { GlobalLayout } from '.'
import { DockTabPaneContext } from '../base/dock/DockTabPane'

const TabTitle = ({ title, disable, icon }: { title: string; disable?: boolean; icon?: ReactNode }) => {
  const tabPaneContext = useContext(DockTabPaneContext)
  useLayoutEffect(() => {
    if (!disable) {
      console.log(title, icon)
      GlobalLayout?.updateTab({
        id: tabPaneContext?.currentTabId,
        title,
        icon
      })
    }
  }, [title, icon])
  return null
}

export default TabTitle
