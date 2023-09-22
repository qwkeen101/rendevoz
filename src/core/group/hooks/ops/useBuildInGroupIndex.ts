import { ObjectStore } from '@/stores'
import { useDebounceEffect, useSelectAtomValue } from '@/hooks'
import { Group } from '@/core/group/hooks/weakmaps'
import { MetaGroupChild } from '~/typings'
import { Path } from 'slate'
import { useGroupInstance } from '@/core/group/hooks/useGroupInstance'
import { useSetAtom } from 'jotai'
import { GroupStateAtom } from '@/core/group/hooks/useGroupState'
import { useEffect } from 'react'

const useBuildInGroupIndex = (groupId: number) => {
  const instance = useGroupInstance()
  const groupData = ObjectStore('group').useValue(groupId)
  const setGroupState = useSetAtom(GroupStateAtom)
  const triggered = useSelectAtomValue(GroupStateAtom, s => s.triggered)
  useEffect(() => {
    const interval = setInterval(() => {
      const selected = instance.values.selectedRowIdSet.size
      setGroupState(s => (s.selectedCount !== selected ? { ...s, selectedCount: selected, triggered: s.triggered + 1 } : s))
    }, 100)
    return () => {
      clearInterval(interval)
    }
  }, [])
  useDebounceEffect(
    () => {
      const selectedSet = instance.values.selectedRowIdSet
      if (groupData?.value) {
        let unToggledCount = 0
        let unToggledSelected = 0
        const id_to_path_map = Group.ID_TO_PATH_MAP.get(instance)
        const id_to_value_map = Group.ID_TO_VALUE_MAP.get(instance)
        if (!id_to_path_map || !id_to_value_map) return
        id_to_path_map.clear()
        const loop = (v: MetaGroupChild, index: number, curr: Path, parentToggled: boolean) => {
          id_to_value_map.set(v.rowId, v)
          const thisPath = [...curr, index]
          id_to_path_map.set(v.rowId, thisPath)
          if (!parentToggled) {
            unToggledCount += 1
            if(selectedSet.has(v.rowId)){
              unToggledSelected += 1
            }
          }
          if (v.children?.length) {
            v.children.forEach((value, index1) => loop(value, index1, thisPath, !!v.toggled))
          }
        }
        groupData.value.forEach((value, index) => {
          loop(value, index, [], false)
        })
        setGroupState(s => ({...s, unToggledValueCount: unToggledCount, unToggledSelectedCount: unToggledSelected}))
        console.log('set')
      }
    },
    [groupData?.value, triggered],
    { wait: 0 }
  )
}

export default useBuildInGroupIndex
