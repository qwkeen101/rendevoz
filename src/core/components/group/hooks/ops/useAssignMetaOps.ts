import { IGroupInstance, MetaObject, PartialWithId } from '~/typings'
import { assignProperties } from '@/utils'
import { MetaStore } from '@/api/stores'
import { useStore } from 'jotai'
import { GroupStateAtom, IGroupState } from '@/core/components/group/hooks/useGroupState'
import { GlobalInstance } from '@/hooks'
import handleCreateInGrouper from '@/core/components/group/components/grouper/handlers/handleCreateInGrouper'
import { InnerGroupInstance } from '@/core/components/group/hooks/useGroupInstance'

const useAssignMetaOps = (instance: InnerGroupInstance) => {
  assignProperties(instance, {
    metaOps: {
      createMeta: async grouperId => {
        const groupState = instance.getGroupState?.()
        if (!groupState) return
        const addAfterCreate = groupState.state?.addAfterCreateMeta
        const currentGroupRule = groupState.currentView?.group
        let onlyCreate = groupState.data?.onlyCreate || groupState.state?.onlyCreateType
        if (currentGroupRule?.fieldType === 'metaType' && grouperId) {
          const grouper = instance.getGroupState?.().groups?.find(i => i.id === grouperId)
          if (grouper?.name) {
            onlyCreate = grouper.name
          }
        }

        GlobalInstance.metaOps?.createObjects(onlyCreate, meta => {
          handleFilterAdd(groupState, meta)
          console.log(meta)
          setTimeout(() => {
            MetaStore.triggerObjectIndex()
            // we do not add into group if have only create, add by parent type group
            if (meta) {
              if (grouperId) {
                handleCreateInGrouper(meta.id, grouperId, instance)
                if (addAfterCreate !== false) {
                  setTimeout(() => {
                    instance.valueOps?.insertValueByPath({
                      type: 'metaObject',
                      id: meta.id
                    })
                  }, 10)
                }
              } else {
                if (addAfterCreate !== false) {
                  instance.valueOps?.insertValueByPath({
                    type: 'metaObject',
                    id: meta.id
                  })
                }
              }
            }
          }, 20)
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
          MetaStore.property.updateProperty(allSelectedMetaIds, field, nextValue)
        } else {
          if (id) {
            MetaStore.property.updateProperty(id, field, nextValue)
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
      deleteMetaInGroup: id => {
        const idArr = Array.isArray(id) ? id : [id]
        const values = instance.getGroupData?.()
        const metaToRowIds = new Map<number, number[]>()
        if (values) {
          values.values.forEach(v => {
            const arr = metaToRowIds.get(v.id) || []
            arr.push(v.rowId)
            metaToRowIds.set(v.id, arr)
          })
          const needDeleteRowIds = new Set<number>()
          idArr.forEach(metaId => {
            metaToRowIds.get(metaId)?.forEach(i => needDeleteRowIds.add(i))
          })
          if (!needDeleteRowIds.size) return
          instance.valueOps?.deleteItems(Array.from(needDeleteRowIds.values()))
        }
      },
      deleteMeta: (ids: number | number[]) => {
        const idArr = Array.isArray(ids) ? ids : [ids]
        idArr.forEach(id => {
          MetaStore.deleteMetaObject(id)
        })
        instance.triggerChange?.()
      }
    }
  })
}

// if have filter, add filter properties to meta
const handleFilterAdd = (groupState: IGroupState, meta: MetaObject) => {
  const f = groupState.currentView?.filter
  if (f) {
    const needUpdateProps: Record<string, any> = {}
    const needUpdateBasic: Record<string, any> = {}
    f.rules.forEach(rule => {
      if (rule.filterType === 'rule') {
        if ('propType' in rule) {
          if (rule.value) {
            switch (rule.type) {
              case 'contains':
              case 'is':
                needUpdateProps[rule.field] = rule.value
                break
            }
          }
          return
        }
        switch (rule.field) {
          case 'name':
          case 'description':
            switch (rule.type) {
              case 'contains':
              case 'is':
                needUpdateBasic[rule.field] = rule.value
            }
            break
          case 'tags':
            switch (rule.type) {
              case 'is':
              case 'contains':
                if (rule.tagIds) {
                  needUpdateBasic[rule.field] = rule.tagIds
                }
            }
            break
        }
      }
    })
    const props = Object.fromEntries(Object.entries(needUpdateProps).map(i => [i[0], { value: i[1] }]))
    console.log(props, needUpdateBasic, f)
    MetaStore.updateMetaObject({ id: meta.id, properties: props, ...needUpdateBasic })
  }
}
export default useAssignMetaOps
