import { IGroupInstance } from '~/typings'
import { assignProperties } from '@/utils'
import { Group } from '../weakmaps'
const useAssignPathOps = (instance: IGroupInstance) => {
  assignProperties(instance, {
    pathOps: {
      getPathById: id => {
        console.log(Group.ID_TO_PATH_MAP.get(instance))
        return Group.ID_TO_PATH_MAP.get(instance)?.get(id)
      }
    }
  })
}

export default useAssignPathOps
