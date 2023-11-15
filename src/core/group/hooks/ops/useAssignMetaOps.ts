import { IGroupInstance } from '~/typings'
import { assignProperties } from '@/utils'
import { MetaStore } from '@/api/stores'

const useAssignMetaOps = (instance: IGroupInstance) => {
  assignProperties(instance, {
    metaOps: {
      // multiple updates
      updateMeta: async nextMeta => {
        const selected = instance.values.selectedRowIdSet
        if (selected.size) {
          const allSelectedMetaIds = Array.from(
            new Set([
              ...Array.from(selected.values())
                .map(i => instance.valueOps?.getValueById(i))
                .filter(i => i && i.type === 'metaObject')
                .map(i => i.id)
            ]).values()
          ) as number[]
          allSelectedMetaIds.forEach(i => {
            MetaStore.updateMetaObject({ ...nextMeta, id: i }, true)
          })
        } else {
          console.log(nextMeta)
          MetaStore.updateMetaObject(nextMeta, true)
        }
        instance.triggerChange?.()
      }
    }
  })
}

export default useAssignMetaOps
