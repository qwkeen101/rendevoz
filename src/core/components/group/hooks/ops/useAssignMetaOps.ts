import { IGroupInstance } from '~/typings'
import { assignProperties } from '@/utils'
import { MetaStore } from '@/api/stores'

const useAssignMetaOps = (instance: IGroupInstance) => {
  assignProperties(instance, {
    metaOps: {
      updateMetaProperty: async (field, nextValue, id?: number) => {
        const selected = instance.values.selectedRowIdSet
        const selectedCell = instance.viewOps?.tableOps?.getCurrentSelectedCell()
        if (selected.size) {
          const rowIds = Array.from(selected.values())
          if (selectedCell) {
            if (!selected.has(selectedCell.rowId)) {
              rowIds.push(selectedCell.rowId)
            }
          }
          const allSelectedMetaIds = Array.from(
            new Set([
              ...rowIds
                .map(i => instance.valueOps?.getValueById(i))
                .filter(i => i && i.type === 'metaObject')
                .map(i => i.id)
            ]).values()
          ) as number[]
          MetaStore.updateProperty(allSelectedMetaIds, field, nextValue)
        } else {
          if (id) {
            MetaStore.updateProperty(id, field, nextValue)
          }
        }
        instance.triggerChange?.()
      },
      // multiple updates
      updateMeta: async nextMeta => {
        const selected = instance.values.selectedRowIdSet
        const selectedCell = instance.viewOps?.tableOps?.getCurrentSelectedCell()
        if (selected.size) {
          const rowIds = Array.from(selected.values())
          if (selectedCell) {
            if (!selected.has(selectedCell.rowId)) {
              rowIds.push(selectedCell.rowId)
            }
          }
          const allSelectedMetaIds = Array.from(
            new Set([
              ...rowIds
                .map(i => instance.valueOps?.getValueById(i))
                .filter(i => i && i.type === 'metaObject')
                .map(i => i.id)
            ]).values()
          ) as number[]
          allSelectedMetaIds.forEach(i => {
            MetaStore.updateMetaObject({ ...nextMeta, id: i }, true)
          })
        } else {
          MetaStore.updateMetaObject(nextMeta, true)
        }
        instance.triggerChange?.()
      }
    }
  })
}

export default useAssignMetaOps
