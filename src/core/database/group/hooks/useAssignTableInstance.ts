import { useTableInstance } from '@/core/database/group/hooks/useTableInstance'
import { assignProperties } from '@/utils'
import produce from 'immer'
import { ObjectStore } from '@/stores'

const useAssignTableInstance = (groupId: number) => {
  const instance = useTableInstance()
  assignProperties(instance, {
    update: (newValue, path) => {
      console.log(newValue, path)
      const rows = instance.getCurrentRows?.()
      if (!rows) {
        return
      } else {
        const newRows = produce(rows, draft => {
          let targetParent = draft
          const lastIndex = path[path.length - 1]
          if (path.length > 1) {
            targetParent = draft[path[0]]
            const copyed = path.slice()
            copyed.shift()
            while (copyed.length > 1) {
              const first = copyed.shift()
              targetParent = targetParent?.children?.[first]
            }
            if (!targetParent.children[lastIndex]) return
            const origin = targetParent.children[lastIndex]

            targetParent.children[lastIndex] = {
              ...origin,
              ...newValue
            }
          } else {
            const origin = draft[lastIndex]
            draft[lastIndex] = {
              ...origin,
              ...newValue
            }
          }
        })
        ObjectStore('group').updateOne({ id: groupId, value: newRows })
      }
    }
  })
}

export default useAssignTableInstance
