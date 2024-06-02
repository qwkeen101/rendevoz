import { useSelectAtomValue } from '@/hooks'
import useGroupState, { GroupStateAtom } from '@/core/components/group/hooks/useGroupState'
import { useEffect } from 'react'
import { MetaStore } from '@/api/stores'
import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
import { MetaGroup } from '~/typings'

export default (groupValue?: MetaGroup) => {
  const mustProperties = useSelectAtomValue(GroupStateAtom, s => s.state?.mustExistProperties)
  const instance = useGroupInstance()
  useEffect(() => {
    if (mustProperties?.length && groupValue?.views.length) {
      const groupState = instance.getGroupState?.()
      if (groupState) {
        const allProps = mustProperties.map(id => MetaStore.property.getPropDetails(id))
        const notExistProps = allProps.filter(i => i && !groupState.data?.properties?.some(o => o.id === i.id))
        console.log(notExistProps)
        notExistProps.forEach(prop => {
          prop && instance.viewOps?.addNewProperty(prop)
        })
      }
    }
  }, [mustProperties, groupValue])
}
