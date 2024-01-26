import { MetaGroupChild, MetaObject } from '~/typings'
import { InnerGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
import { IGroupGrouper } from '@/core/components/group/hooks/useGroupState'
import handleCreateInGrouper from '@/core/components/group/components/grouper/handlers/handleCreateInGrouper'

export default (dragMetas: number | number[], targetValue: MetaGroupChild, instance: InnerGroupInstance) => {
  const groupers = instance.getGroupState?.().groups
  if (!groupers?.length) {
    return
  }
  let group: IGroupGrouper | undefined = undefined
  for (const g of groupers) {
    if (g.values.some(v => v.tempRowId === targetValue.tempRowId)) {
      group = g
      break
    }
  }
  if (group) {
    handleCreateInGrouper(dragMetas, group.id, instance)
  }
}
