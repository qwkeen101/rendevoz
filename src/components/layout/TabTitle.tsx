import { useContext, useLayoutEffect } from 'react'
import { GlobalLayout } from '.'
import { DockTabPaneContext } from '../base/dock/DockTabPane'

const TabTitle = ({ title, disable }: { title: string; disable?: boolean }) => {
  const tabPaneContext = useContext(DockTabPaneContext)
  useLayoutEffect(() => {
    if (!disable) {
      GlobalLayout?.updateTab({
        id: tabPaneContext?.currentTabId,
        title
      })
    }
  }, [title])
  return null
}

export default TabTitle
