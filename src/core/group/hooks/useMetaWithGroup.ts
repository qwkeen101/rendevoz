import { MetaGroupChild } from '~/typings'
import { useSelectGlobalAtomValue } from '@/hooks'
import { MetaIdToGroupAtom } from '@/stores/group.store'
import { useEffect } from 'react'
import { isEqual } from 'lodash'
import { ObjectStore } from '@/stores'
import { Path } from 'slate'
import { useGroupInstance } from '@/core/group/hooks/useGroupInstance'
import { getAllMetasInTable } from '@/core/group/actions/search'

/**
 * 如果组里面有自己，那么禁止同步，禁止无限嵌套
 */
const useMetaWithGroup = (currentValue: MetaGroupChild, metaId: number, path: Path) => {
  const metaHasGroup = useSelectGlobalAtomValue(MetaIdToGroupAtom, s => s.get(metaId))
  const targetGroup = ObjectStore('group').useValue(metaHasGroup)
  const instance = useGroupInstance()

  useEffect(() => {
    if (targetGroup && currentValue.children) {
      const targetGroupValue = targetGroup.value

      const allMetasInCurrentValue = getAllMetasInTable(currentValue.children)
      if (allMetasInCurrentValue.has(metaId)) return
      if (!isEqual(targetGroupValue, currentValue.children)) {
        ObjectStore('group').updateOne({ id: targetGroup.id, value: currentValue.children })
      }
    }
  }, [currentValue.children])
  useEffect(() => {
    if (targetGroup?.value) {
      const targetGroupValue = targetGroup.value
      console.log(targetGroupValue, currentValue.children)
      if (!targetGroupValue) return

      const allMetasInTargetValue = getAllMetasInTable(targetGroupValue)
      if (allMetasInTargetValue.has(metaId)) return
      const allMetasInCurrentValue = getAllMetasInTable(currentValue.children)
      if (allMetasInCurrentValue.has(metaId)) return
      if (!isEqual(targetGroupValue, currentValue.children)) {
        instance.valueOps?.updateValueByPath({ children: targetGroupValue }, path)
      }
    }
  }, [targetGroup?.value])
  return targetGroup
}

export default useMetaWithGroup
