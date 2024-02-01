import { IGroupInstance, MetaObject, PartialWithId } from '~/typings'
import { assignProperties } from '@/utils'
import { MetaStore } from '@/api/stores'
import { useStore } from 'jotai'
import { GroupStateAtom } from '@/core/components/group/hooks/useGroupState'
import { GlobalInstance } from '@/hooks'
import handleCreateInGrouper from '@/core/components/group/components/grouper/handlers/handleCreateInGrouper'
import { InnerGroupInstance } from '@/core/components/group/hooks/useGroupInstance'

const useAssignMetaOps = (instance: InnerGroupInstance) => {
  const store = useStore()
  assignProperties(instance, {
    metaOps: {
      createMeta: async grouperId => {
        const currentGroupRule = instance.getGroupState?.().currentView?.group
        let onlyCreate = store.get(GroupStateAtom).state?.onlyCreateType
        if (currentGroupRule?.fieldType === 'metaType' && grouperId) {
          const grouper = instance.getGroupState?.().groups?.find(i => i.id === grouperId)
          if (grouper?.name) {
            onlyCreate = grouper.name
          }
        }

        GlobalInstance.metaOps?.createObjects(onlyCreate, meta => {
          console.log(meta)
          setTimeout(() => {
            MetaStore.triggerObjectIndex()
            // we do not add into group if have only create, add by parent type group
            if (meta) {
              if (grouperId) {
                handleCreateInGrouper(meta.id, grouperId, instance)
                setTimeout(() => {
                  instance.valueOps?.insertValueByPath({
                    type: 'metaObject',
                    id: meta.id
                  })
                }, 10)
              } else {
                instance.valueOps?.insertValueByPath({
                  type: 'metaObject',
                  id: meta.id
                })
              }
            }
          }, 200)
        })
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
