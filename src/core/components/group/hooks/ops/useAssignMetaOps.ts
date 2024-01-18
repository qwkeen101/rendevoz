import { IGroupInstance, MetaObject, PartialWithId } from '~/typings'
import { assignProperties } from '@/utils'
import { MetaStore } from '@/api/stores'
import { useStore } from 'jotai'
import { GroupStateAtom } from '@/core/components/group/hooks/useGroupState'
import { GlobalInstance } from '@/hooks'

const useAssignMetaOps = (instance: IGroupInstance) => {
  const store = useStore()
  assignProperties(instance, {
    metaOps: {
      createMeta: async () => {
        const onlyCreate = store.get(GroupStateAtom).state?.onlyCreateType
        const meta = await GlobalInstance.metaOps?.createObject(onlyCreate)
        MetaStore.triggerObjectIndex()
        // we do not add into group if have only create, add by parent type group
        if (meta) {
          instance.valueOps?.insertValueByPath({
            type: 'metaObject',
            id: meta.id
          })
        }
      },
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
            MetaStore.updateMetaObject({ ...nextMeta, id: i })
          })
        } else {
          if (nextMeta.id) {
            MetaStore.updateMetaObject(nextMeta as PartialWithId<MetaObject>)
          }
        }
        instance.triggerChange?.()
      },
      deleteMeta: (ids: number | number[]) => {
        const idArr = Array.isArray(ids) ? ids : [ids]
        const deleteMetaWhenDeleteItem = instance.getGroupState?.().state?.deleteMetaWhenDeleteItem
        idArr.forEach(id => {
          MetaStore.deleteMetaObject(id)
        })
        instance.triggerChange?.()
      }
    }
  })
}

export default useAssignMetaOps
