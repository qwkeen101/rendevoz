import { useContext, useLayoutEffect } from 'react'
import { GlobalLayout } from '.'
import { DockTabPaneContext } from '../base/dock/DockTabPane'

const TabTitle = ({ title }: { title: string }) => {
  const tabPaneContext = useContext(DockTabPaneContext)
  useLayoutEffect(() => {
    GlobalLayout?.updateTab({
      id: tabPaneContext?.currentTabId,
      title
    })
  }, [title])
  return null
}

export default TabTitle
