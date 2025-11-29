// common actions like delete, create
import { InnerGroupInstance } from '@/core/components/group/hooks/useGroupInstance'

export type GroupCommonActions =
  | 'delete-obj'
  | 'open-in-new-tab'
  | 'open-in-side-peek'
  | 'move-to'
  | 'edit'
  | 'view-details'
  | 'copy-link'
  | 'copy-link-to-all'
  | 'delete-in-group'
export default (instance: InnerGroupInstance, type: GroupCommonActions) => {
  const selected = instance.selectOps?.getSelectedItems()
  const details = selected?.[0]?.[0]
  if (!details) return
  switch (type) {
    case 'open-in-side-peek': {
      instance.sidebarOps?.open({
        type: 'preview',
        metaId: details.id,
        rowId: details.rowId
      })
      return
    }
    case 'open-in-new-tab': {
      Global.layoutOps?.openObject(details.id)
      return
    }
    case 'delete-obj': {
      const selected = instance.selectOps?.getSelectedItems()
      if (selected?.length) {
        instance.valueOps?.deleteItems(
          selected.map(i => i[0].rowId),
          { deleteMeta: true }
        )
        return
      }
      instance.valueOps?.deleteItems(details.rowId, { deleteMeta: true })
      return
    }
    case 'view-details': {
      Global.metaOps?.openDetails(details.id)
      return
    }
    case 'delete-in-group': {
      const selected = instance.selectOps?.getSelectedItems()
      if (selected?.length) {
        instance.valueOps?.deleteItems(selected.map(i => i[0].rowId))
        return
      }
      instance.valueOps?.deleteItems(details.rowId)
      return
    }
    case 'copy-link-to-all': {
      Global.metaOps?.copyLink(selected?.map(i => i[0].id))
      return
    }
    case 'copy-link': {
      Global.metaOps?.copyLink(details.id)
      return
    }
    case 'edit': {
      Global.metaOps.edit(details.id)
      return
    }
    case 'move-to': {
      const allIds = new Set(selected?.map(i => i[0].id))
      Global.metaOps?.quickAdd(Array.from(allIds.values()))
      return
    }
  }
}
