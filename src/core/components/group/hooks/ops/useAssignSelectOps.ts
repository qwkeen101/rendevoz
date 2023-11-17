import { IGroupInstance } from '~/typings'
import { assignProperties } from '@/utils'
import Node from '@/core/components/group/utils/node'
import { useStore } from 'jotai'
import { GroupStateAtom } from '@/core/components/group/hooks/useGroupState'

export default (instance: IGroupInstance) => {
  const store = useStore()
  assignProperties(instance, {
    selectOps: {
      clearAllSelect: () => {
        instance.values.inViewRowFuncs.forEach(v => v.clearSelectState())
        instance.values.selectedRowIdSet.clear()
        instance.values.lastSelectRowId = undefined
      },
      selectBetweenPath: (startPath, endPath) => {
        const groupState = store.get(GroupStateAtom)
        const values = groupState.filterValues || groupState.viewValues || []
        const elements = Node.fragment({ children: values }, startPath, endPath)
        const visible = instance.valueOps?.getVisibleValues()
        const visibleIds = new Set(visible?.map(i => i[0].rowId))
        elements.forEach(i => {
          if (visibleIds.has(i[0].rowId)) {
            instance.values.inViewRowFuncs.get(i[0].rowId)?.select()
            instance.values.selectedRowIdSet.add(i[0].rowId)
          }
        })
      },
      getSelectedItems: () => {
        const selectedRowIds = Array.from(instance.values.selectedRowIdSet.values())
        const items = selectedRowIds
          .map(id => {
            const value = instance.valueOps?.getValueById(id)
            const path = instance.pathOps?.getPathById(id)
            if (value && path) {
              return [value, path]
            }
          })
          .filter(i => i)
        return items
      },
      selectAll: () => {
        const elements = instance.valueOps?.getVisibleValues()
        if (elements) {
          instance.values.inViewRowFuncs.forEach(v => v.select())
          elements.forEach(([e, p]) => {
            instance.values.selectedRowIdSet.add(e.rowId)
          })
        }
      }
    }
  })
}
