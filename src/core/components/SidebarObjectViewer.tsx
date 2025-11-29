import { DockTabPaneContext } from '@/components/base/dock/DockTabPane'
import { LabelDetailsContext } from '@/core/object/renderer/LabelDetailsContext'
import PageConfigContext, { IPageConfig } from '@/core/components/PageConfigContext'
import { MetaStore } from '@/api/stores'

export default ({ id, pageConfig }: { id: number; pageConfig?: IPageConfig }) => {
  const m = MetaStore.useValue(id)
  if (!m) return null
  const tabData = Global.layoutOps?.getRegisteredTabData(m.type)
  if (tabData && 'content' in tabData && tabData.content) {
    return (
      <DockTabPaneContext.Provider value={{ currentTabId: '0' }} key={m.id}>
        <LabelDetailsContext.Provider
          value={{
            sidebarMode: true
          }}
        >
          <PageConfigContext.Provider
            value={{
              defaultOpenSidebar: false,
              ...pageConfig
            }}
          >
            {tabData.content({
              objectId: m.objectId,
              type: m.type,
              metaId: m.id
            })}
          </PageConfigContext.Provider>
        </LabelDetailsContext.Provider>
      </DockTabPaneContext.Provider>
    )
  }
}
