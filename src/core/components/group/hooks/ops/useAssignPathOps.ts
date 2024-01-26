import { IGroupInstance } from '~/typings'
import { assignProperties } from '@/utils'
import { Group } from '../weakmaps'
import { PathRef } from 'slate'
import { InnerGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
const useAssignPathOps = (instance: InnerGroupInstance) => {
  assignProperties(instance, {
    pathOps: {
      getPathById: (id, afterFilter) => {
        const realRowId = instance.getRealRowId?.(id)
        const groupedValue = instance.getGroupState?.().groupedValues
        if (!realRowId) return
        if (afterFilter) {
          if (groupedValue) {
            return Group.ID_TO_GROUP_PATH_MAP.get(instance)?.get(id)
          }
          return Group.ID_TO_FILTER_PATH_MAP.get(instance)?.get(realRowId) || Group.ID_TO_PATH_MAP.get(instance)?.get(realRowId)
        } else {
          return Group.ID_TO_PATH_MAP.get(instance)?.get(realRowId)
        }
      },
      pathRef: path => {
        const ref: PathRef = {
          current: path,
          affinity: 'forward',
          unref() {
            const { current } = ref
            const refs = instance.values.pathRefs
            refs.delete(ref)
            ref.current = null
            return current
          }
        }
        instance.values.pathRefs.add(ref)
        return ref
      }
    }
  })
}

export default useAssignPathOps
