import { MetaGroupChild } from '~/typings'
import { useDebounceEffect, useSelectGlobalAtomValue } from '@/hooks'
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

  useDebounceEffect(
    () => {
      if (targetGroup && currentValue.children && currentValue.syncVersion) {
        const targetGroupValue = targetGroup.value

        const allMetasInCurrentValue = getAllMetasInTable(currentValue.children)
        if (allMetasInCurrentValue.has(metaId)) return
        if (!isEqual(targetGroupValue, currentValue.children)) {
          const nextVersion = targetGroup.syncVersion + 1
          instance.valueOps?.updateValueByPath({ syncVersion: nextVersion }, path)
          ObjectStore('group').updateOne({ id: targetGroup.id, value: currentValue.children, syncVersion: nextVersion })
        }
      }
    },
    [currentValue.children],
    { wait: 300 }
  )
  useEffect(() => {
    if (targetGroup?.syncVersion && targetGroup.syncVersion > (currentValue.syncVersion || 0)) {
      const targetGroupValue = targetGroup.value
      console.log(targetGroupValue, currentValue.children)
      if (!targetGroupValue) return

      const allMetasInTargetValue = getAllMetasInTable(targetGroupValue)
      if (allMetasInTargetValue.has(metaId)) return
      const allMetasInCurrentValue = getAllMetasInTable(currentValue.children)
      if (allMetasInCurrentValue.has(metaId)) return
      if (!isEqual(targetGroupValue, currentValue.children)) {
        instance.valueOps?.updateValueByPath({ children: targetGroupValue, syncVersion: targetGroup.syncVersion }, path)
      }
    }
  }, [targetGroup?.syncVersion])
  return targetGroup
}

export default useMetaWithGroup
