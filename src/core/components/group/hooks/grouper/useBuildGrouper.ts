import { useSelectAtomValue } from '@/hooks'
import { useMemo } from 'react'
import { selectAtom } from 'jotai/utils'
import { GroupStateAtom } from '@/core/components/group/hooks/useGroupState'
import { atom, useAtom, useSetAtom } from 'jotai'
import stringGroupCalculator from '@/core/components/group/hooks/grouper/calculator/string'
import { MetaStore } from '@/api/stores'
import selectGroupCalculator from '@/core/components/group/hooks/grouper/calculator/select'

export default () => {
  const setGroupState = useSetAtom(GroupStateAtom)
  const subAtom = useMemo(() => {
    const valuesAtom = selectAtom(GroupStateAtom, s => s.viewValues)
    const filterValuesAtom = selectAtom(GroupStateAtom, s => s.filterValues)
    const groupRuleAtom = selectAtom(GroupStateAtom, s => s.currentView?.group)
    const finalAtom = atom(get => {
      const values = get(valuesAtom)
      const filterValues = get(filterValuesAtom)
      const groupRule = get(groupRuleAtom)
      const finalValues = filterValues || values
      if (finalValues && groupRule) {
        if (groupRule.propertyGroupType === 'basic') {
        }
        if (groupRule.propertyGroupType === 'custom') {
          const prop = MetaStore.getPropDetails(groupRule.propertyId)
          let result = undefined
          switch (prop?.propType) {
            case 'string':
              result = stringGroupCalculator(finalValues, o => (o.properties?.[prop.id]?.value as string | undefined) ?? '', {
                textBy: 'alphabetical',
                fieldType: 'string',
                sort: 'alphabetical'
              })
              break
            case 'number':
              break
            case 'singleSelect':
            case 'multiSelect':
              result = selectGroupCalculator(finalValues, o => (o.properties?.[prop.id]?.value as number | number[] | undefined) ?? [], {
                fieldType: 'select',
                sort: 'manual'
              })
              break
          }
          if (result) {
            setGroupState(s => ({ ...s, groups: result }))
          }
          console.log(result)
        }
      }
    })

    return finalAtom
  }, [])
  useAtom(subAtom)
}
