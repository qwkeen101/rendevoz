import { ObjectStore } from '@/api/stores'
import { useDebounceEffect, useSelectAtomValue } from '@/hooks'
import { Group } from '@/core/components/group/hooks/weakmaps'
import { MetaGroupChild } from '~/typings'
import { Path } from 'slate'
import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
import { useSetAtom } from 'jotai'
import { GroupStateAtom } from '@/core/components/group/hooks/useGroupState'
import { useEffect } from 'react'

const useBuildInGroupIndex = () => {
  const instance = useGroupInstance()
  const groupedValues = useSelectAtomValue(GroupStateAtom, s => s.groupedValues)
  const filterValues = useSelectAtomValue(GroupStateAtom, s => s.filterValues)
  const values = useSelectAtomValue(GroupStateAtom, s => s.viewValues)
  const setGroupState = useSetAtom(GroupStateAtom)
  const triggered = useSelectAtomValue(GroupStateAtom, s => s.triggered)
  const unToggled = useSelectAtomValue(GroupStateAtom, s => s.currentView?.unToggledIds)
  useEffect(() => {
    let firstSelected: undefined | number = undefined
    const interval = setInterval(() => {
      const selected = instance.values.selectedRowIdSet.size
      let trigger = false

      if (selected === 1) {
        const first = instance.values.selectedRowIdSet.values().next().value
        console.log(firstSelected, first)
        if (firstSelected && first !== firstSelected) {
          trigger = true
        }
        firstSelected = first
      }
      setGroupState(s => (s.selectedCount !== selected || trigger ? { ...s, selectedCount: selected, triggered: s.triggered + 1 } : s))
    }, 100)
    return () => {
      clearInterval(interval)
    }
  }, [])
  useDebounceEffect(
    () => {
      const selectedSet = instance.values.selectedRowIdSet
      const unToggledIdSet = new Set(unToggled)
      const unToggleSelectedRowIdsSet = new Set<number>()
      if (values) {
        let unToggledCount = 0
        let unToggledSelected = 0
        const id_to_path_map = Group.ID_TO_PATH_MAP.get(instance)
        const id_to_value_map = Group.ID_TO_VALUE_MAP.get(instance)

        if (!id_to_path_map || !id_to_value_map) return
        id_to_path_map.clear()
        id_to_value_map.clear()
        const loop = (
          v: MetaGroupChild,
          index: number,
          curr: Path,
          parentToggled: boolean,
          countSelectAndToggle: boolean,
          pathMap: Map<number, Path>
        ) => {
          id_to_value_map.set(v.rowId, v)
          const thisPath = [...curr, index]
          pathMap.set(v.rowId, thisPath)
          if (countSelectAndToggle) {
            if (!parentToggled) {
              unToggledCount += 1
              if (selectedSet.has(v.tempRowId || v.rowId)) {
                unToggledSelected += 1
                unToggleSelectedRowIdsSet.add(v.tempRowId || v.rowId)
              }
            }
          }
          if (v.children?.length) {
            const toggled = !unToggledIdSet.has(v.rowId)
            v.children.forEach((value, index1) => loop(value, index1, thisPath, toggled, countSelectAndToggle, pathMap))
          }
        }
        values.forEach((value, index) => {
          loop(value, index, [], false, !filterValues?.length, id_to_path_map)
        })
        if (!filterValues?.length && !groupedValues?.length) {
          setGroupState(s => ({
            ...s,
            unToggledSelectedRowIds: unToggleSelectedRowIdsSet,
            unToggledValueCount: unToggledCount,
            unToggledSelectedCount: unToggledSelected
          }))
        }
      }
    },
    [values, triggered],
    { wait: 0 }
  )

  useEffect(() => {
    if (filterValues?.length) {
      const selectedSet = instance.values.selectedRowIdSet
      const unToggledIdSet = new Set(unToggled)
      const unToggleSelectedRowIdsSet = new Set<number>()
      const id_to_filter_path_map = new Map<number, Path>()
      let unToggledCount = 0
      let unToggledSelected = 0
      const loop = (
        v: MetaGroupChild,
        index: number,
        curr: Path,
        parentToggled: boolean,
        countSelectAndToggle: boolean,
        pathMap: Map<number, Path>
      ) => {
        const thisPath = [...curr, index]
        pathMap.set(v.rowId, thisPath)
        if (countSelectAndToggle) {
          if (!parentToggled) {
            unToggledCount += 1
            if (selectedSet.has(v.tempRowId || v.rowId)) {
              unToggledSelected += 1
              unToggleSelectedRowIdsSet.add(v.tempRowId || v.rowId)
            }
          }
        }
        if (v.children?.length) {
          const toggled = !unToggledIdSet.has(v.rowId)
          v.children.forEach((value, index1) => loop(value, index1, thisPath, toggled, countSelectAndToggle, pathMap))
        }
      }
      filterValues.forEach((value, index) => {
        loop(value, index, [], false, true, id_to_filter_path_map)
      })

      Group.ID_TO_FILTER_PATH_MAP.set(instance, id_to_filter_path_map)
      if (!groupedValues?.length) {
        setGroupState(s => ({
          ...s,
          unToggledSelectedRowIds: unToggleSelectedRowIdsSet,
          unToggledValueCount: unToggledCount,
          unToggledSelectedCount: unToggledSelected
        }))
      }
    }
  }, [filterValues, triggered])

  useEffect(() => {
    if (groupedValues?.length) {
      const selectedSet = instance.values.selectedRowIdSet
      const unToggledIdSet = new Set(unToggled)
      const unToggleSelectedRowIdsSet = new Set<number>()
      const id_to_filter_path_map = new Map<number, Path>()
      let unToggledCount = 0
      let unToggledSelected = 0
      const loop = (
        v: MetaGroupChild,
        index: number,
        curr: Path,
        parentToggled: boolean,
        countSelectAndToggle: boolean,
        pathMap: Map<number, Path>
      ) => {
        if (!v.tempRowId) return
        const thisPath = [...curr, index]
        pathMap.set(v.tempRowId, thisPath)
        if (countSelectAndToggle) {
          if (!parentToggled) {
            unToggledCount += 1
            if (selectedSet.has(v.tempRowId || v.rowId)) {
              unToggledSelected += 1
              unToggleSelectedRowIdsSet.add(v.tempRowId || v.rowId)
            }
          }
        }
        if (v.children?.length) {
          const toggled = !unToggledIdSet.has(v.rowId)
          v.children.forEach((value, index1) => loop(value, index1, thisPath, toggled, countSelectAndToggle, pathMap))
        }
      }
      groupedValues.forEach((value, index) => {
        loop(value, index, [], false, true, id_to_filter_path_map)
      })

      Group.ID_TO_GROUP_PATH_MAP.set(instance, id_to_filter_path_map)
      setGroupState(s => ({
        ...s,
        unToggledSelectedRowIds: unToggleSelectedRowIdsSet,
        unToggledValueCount: unToggledCount,
        unToggledSelectedCount: unToggledSelected
      }))
    }
  }, [groupedValues, triggered])
  useEffect(() => {
    if (unToggled) {
      setGroupState(s => ({ ...s, unToggledIdSet: new Set(unToggled), triggered: s.triggered + 1 }))
    }
  }, [unToggled])
}

export default useBuildInGroupIndex
