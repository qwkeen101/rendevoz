import { IGroupInstance } from '~/typings'
import { assignProperties } from '@/utils'
import { useSetAtom } from 'jotai'
import { GroupStateAtom } from '@/core/components/group/hooks/useGroupState'

export default (instance: IGroupInstance) => {
  const setGroupState = useSetAtom(GroupStateAtom)
  assignProperties(instance, {
    sidebarOps: {
      open: details => {
        setGroupState(s => ({ ...s, sidebarState: details, sidebarVisible: true }))
      }
    }
  })
}
