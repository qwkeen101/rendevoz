import { IGroupGrouper, IGroupInstance } from '~/typings'
import produce from 'immer'
import Id from '@/utils/id'

export default (groups: IGroupGrouper[], instance: IGroupInstance, oldGroups?: IGroupGrouper[]) => {
  instance.values.tempRowIdToRowIdMap.clear()
  const newGroup = produce(groups, draft => {
    draft.forEach(g => {
      const oldG = oldGroups?.find(o => o.id === g.id)
      const oldGRowIdToTempId = new Map(oldG?.values.map(v => [v.rowId, v.tempRowId]))
      g.values = g.values.map(i => {
        let tempRowId = i.tempRowId || oldGRowIdToTempId.get(i.rowId)
        if (!tempRowId) {
          tempRowId = Id.getId()
        }
        instance.values.tempRowIdToRowIdMap.set(tempRowId, i.rowId)
        return {
          ...i,
          tempRowId: tempRowId
        }
      })
    })
  })
  console.log(newGroup)
  return newGroup
}
