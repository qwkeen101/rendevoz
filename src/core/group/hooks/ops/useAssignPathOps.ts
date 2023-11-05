import { IGroupInstance } from '~/typings'
import { assignProperties } from '@/utils'
import { Group } from '../weakmaps'
import { PathRef } from 'slate'
const useAssignPathOps = (instance: IGroupInstance) => {
  assignProperties(instance, {
    pathOps: {
      getPathById: (id, afterFilter) => {
        if (afterFilter) {
          return Group.ID_TO_FILTER_PATH_MAP.get(instance)?.get(id) || Group.ID_TO_PATH_MAP.get(instance)?.get(id)
        } else {
          return Group.ID_TO_PATH_MAP.get(instance)?.get(id)
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
