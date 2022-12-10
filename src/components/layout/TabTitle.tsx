import { useContext, useLayoutEffect } from 'react'
import { LayoutContext } from '.'
import { DockTabPaneContext } from '../base/dock/DockTabPane'

const TabTitle = ({ title }: { title: string }) => {
  const tabPaneContext = useContext(DockTabPaneContext)
  const layoutContext = useContext(LayoutContext)
  useLayoutEffect(() => {
    layoutContext?.updateTab({
      id: tabPaneContext?.currentTabId,
      title
    })
  }, [title])
  return null
}

export default TabTitle
