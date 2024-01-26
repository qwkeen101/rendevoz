import { useGlobalAtom } from '@/hooks'
import { useMemo } from 'react'
import { selectAtom } from 'jotai/utils'
import { GroupStateAtom } from '@/core/components/group/hooks/useGroupState'
import { atom, useAtom, useSetAtom, useStore } from 'jotai'
import stringGroupCalculator from '@/core/components/group/hooks/grouper/calculator/string'
import { MetaStore } from '@/api/stores'
import selectGroupCalculator from '@/core/components/group/hooks/grouper/calculator/select'
import { metaObjectsAtom } from '@/api/stores/meta/meta.store'
import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
import { debounce } from 'lodash'
import checkboxGroupCalculator from '@/core/components/group/hooks/grouper/calculator/checkbox'
import dateGroupCalculator from '@/core/components/group/hooks/grouper/calculator/date'
import calculateSort from '@/core/components/group/hooks/grouper/sort/calculateSort'
import { IMetaGroupGrouper, MetaGroupChild, MetaObject } from '~/typings'
import { DEFAULT_GROUP_PROPERTY_OBJ } from '@/core/components/group/consts/defaultProperties'
import assignTempRowId from '@/core/components/group/hooks/grouper/assignTempRowId'
import numberGroupCalculator, {
  GROUPER_DEFAULT_GROUP_EVERY,
  GROUPER_DEFAULT_GROUP_RANGE
} from '@/core/components/group/hooks/grouper/calculator/number'
import DEFAULT_GROUPER from '@/core/components/group/components/grouper/consts/DEFAULT_GROUPER'
import { Group } from '@/core/components/group/hooks/weakmaps'
import metaTypeGroupCalculator from '@/core/components/group/hooks/grouper/calculator/metaType'

export const EMPTY_GROUPER_NAME = DEFAULT_GROUPER.EMPTY_GROUPER_NAME
export default () => {
  const setGroupState = useSetAtom(GroupStateAtom)
  const instance = useGroupInstance()
  const store = useStore()
  const subAtom = useMemo(() => {
    const valuesAtom = selectAtom(
      GroupStateAtom,
      s => s.viewValues,
      (a, b) => (a?.length === b?.length && a?.every((i, index) => b?.[index] === i)) ?? false
    )
    const filterValuesAtom = selectAtom(
      GroupStateAtom,
      s => s.filterValues,
      (a, b) => (a?.length === b?.length && a?.every((i, index) => b?.[index] === i)) ?? false
    )
    const groupRuleAtom = selectAtom(GroupStateAtom, s => s.currentView?.group)
    const metaChangeAtom = selectAtom(GroupStateAtom, s => s.metaChanged)
    const debounceBuild = (groupRule: IMetaGroupGrouper, finalValues: MetaGroupChild[]) => {
      const groupState = store.get(GroupStateAtom)
      const existedGroupers = groupState.currentView?.storedGroups || groupState.groups
      console.log('build')
      let prop = undefined
      let propGetter: ((o: MetaObject) => any) | undefined = undefined
      if (groupRule.propertyGroupType === 'basic') {
        prop = DEFAULT_GROUP_PROPERTY_OBJ[groupRule.propertyId]
        if (prop) {
          propGetter = o => o[prop.name]
        }
      }
      if (groupRule.propertyGroupType === 'custom') {
        prop = MetaStore.getPropDetails(groupRule.propertyId)
        if (prop) {
          propGetter = o => o.properties?.[prop.id]?.value
        }
      }
      if (prop && 'propType' in prop && propGetter) {
        let result = undefined
        switch (prop?.propType) {
          case 'string':
            result = stringGroupCalculator(
              finalValues,
              o => propGetter(o) || EMPTY_GROUPER_NAME,
              {
                textBy: groupRule.textBy || 'alphabetical',
                fieldType: 'string',
                sort: 'alphabetical'
              },
              structuredClone(existedGroupers)
            )
            break
          case 'number':
            result = numberGroupCalculator(
              finalValues,
              o => propGetter(o) ?? EMPTY_GROUPER_NAME,
              {
                fieldType: 'number',
                sort: groupRule.sort || 'ascending',
                groupEvery: groupRule.groupEvery ?? GROUPER_DEFAULT_GROUP_EVERY,
                groupRange: groupRule.groupRange ?? GROUPER_DEFAULT_GROUP_RANGE
              },
              structuredClone(existedGroupers)
            )
            break
          case 'date':
            result = dateGroupCalculator(
              finalValues,
              o => propGetter(o) ?? EMPTY_GROUPER_NAME,
              {
                fieldType: 'date',
                dateBy: groupRule.dateBy || 'relative',
                sort: groupRule.sort || 'newestFirst'
              },
              structuredClone(existedGroupers)
            )
            break
          case 'checkbox':
            result = checkboxGroupCalculator(
              finalValues,
              o => propGetter(o) ?? false,
              {
                fieldType: 'checkbox'
              },
              structuredClone(existedGroupers)
            )
            break
          case 'singleSelect':
          case 'multiSelect':
            result = selectGroupCalculator(
              finalValues,
              o => propGetter(o) ?? [EMPTY_GROUPER_NAME],
              {
                fieldType: prop.propType,
                sort: 'manual'
              },
              structuredClone(existedGroupers)
            )
            break
          case 'metaType':
            result = metaTypeGroupCalculator(
              finalValues,
              o => o['type'] ?? EMPTY_GROUPER_NAME,
              {
                fieldType: 'metaType',
                sort: 'manual'
              },
              structuredClone(existedGroupers)
            )
        }
        if (result) {
          // cancel changed group select
          const prevRowIdToGroupId: Record<number, number> = {}
          existedGroupers?.forEach(g => {
            g.values.forEach(v => {
              prevRowIdToGroupId[v.rowId] = g.id
            })
          })
          if (!existedGroupers) {
            const emptyValues = result.find(i => i.name === EMPTY_GROUPER_NAME)
            if (emptyValues) {
              result = [...result.filter(i => i.name !== EMPTY_GROUPER_NAME), emptyValues]
            }
          }
          result.some(r =>
            r.values.some(v => {
              if (prevRowIdToGroupId[v.rowId] !== r.id) {
                instance.selectOps?.clearAllSelect()
                instance.viewOps?.tableOps?.deselectCell()
                return true
              }
            })
          )
          // sort by original groups
          if (existedGroupers && groupRule.sort === 'manual') {
            const idWithPos: Record<number, number> = {}
            existedGroupers.forEach((g, index) => {
              idWithPos[g.id] = index
            })
            result.sort((b, a) => (idWithPos[b.id] ?? Number.MAX_SAFE_INTEGER) - (idWithPos[a.id] ?? 0))
          }
          if ('sort' in groupRule) {
            calculateSort(result, groupRule)
          }
          result = assignTempRowId(result, instance, existedGroupers)
          console.log(result, 'updated')
          setGroupState(s => ({ ...s, groups: result }))
        }
      }
    }
    let prev = undefined
    const finalAtom = atom(get => {
      const metaChange = get(metaChangeAtom)
      const values = get(valuesAtom)
      const filterValues = get(filterValuesAtom)
      const groupRule = get(groupRuleAtom)
      const finalValues = filterValues || values
      if (finalValues && groupRule) {
        const curr = {
          groupRule,
          values,
          metaChange,
          filterValues
        }
        if (prev) {
          Object.keys(prev).forEach(k => {
            const equal = prev[k] === curr[k]
            if (!equal) {
              console.log(k, prev[k], curr[k])
            }
          })
        }
        prev = curr
        debounceBuild(groupRule, finalValues)
      } else {
        const groupState = store.get(GroupStateAtom)
        if (groupState.groupedValues || groupState.groups || groupState.currentView?.storedGroups) {
          setGroupState(s => ({ ...s, groups: undefined }))
          Group.ID_TO_GROUP_PATH_MAP.get(instance)?.clear()
          instance.values.tempRowIdToRowIdMap.clear()
        }
      }
    })

    return finalAtom
  }, [])
  const subMetasAtom = useMemo(() => {
    const prevMetas = new Map<number, MetaObject>()
    const debounceSet = debounce(() => {
      let trigger = false
      const allMetasInGroup = instance.valueOps?.getAllMetasInGroup?.()
      if (allMetasInGroup) {
        allMetasInGroup.forEach(m => {
          const prev = prevMetas.get(m.id)
          if (prev !== m) {
            trigger = true
            prevMetas.set(m.id, m)
          }
        })
      }
      if (trigger) {
        setGroupState(s => ({ ...s, metaChanged: (s.metaChanged ?? 0) + 1 }))
      }
    }, 0)
    return atom(get => {
      get(metaObjectsAtom)
      debounceSet()
    })
  }, [])

  const subGroupsChangeAtom = useMemo(() => {
    const groupsAtom = selectAtom(GroupStateAtom, s => s.groups)
    return atom(get => {
      const groups = get(groupsAtom)
      const groupedValue = groups?.flatMap(i => (i.visible && !i.hidden ? i.values : []))
      setGroupState(s => ({ ...s, groupedValues: groupedValue }))
      instance.updateCurrentView?.(w => ({ ...w, storedGroups: groups }))
    })
  }, [])
  const subViewChangeAutoAddGrouper = useMemo(() => {
    const viewTypeAtom = selectAtom(GroupStateAtom, s => s.currentView?.type)
    const subAtom = atom(get => {
      const viewType = get(viewTypeAtom)
      if (viewType === 'kanban') {
        const currentViewGrouper = store.get(GroupStateAtom).currentView?.group
        if (!currentViewGrouper) {
          setTimeout(() => {
            instance.updateCurrentView?.(w => ({
              ...w,
              group: {
                propertyId: 2,
                propertyGroupType: 'basic',
                fieldType: 'string',
                textBy: 'alphabetical',
                sort: 'alphabetical'
              }
            }))
          })
        }
      }
    })
    return subAtom
  }, [])
  useAtom(subAtom)
  useAtom(subViewChangeAutoAddGrouper)
  useAtom(subGroupsChangeAtom)
  useGlobalAtom(subMetasAtom)
}
