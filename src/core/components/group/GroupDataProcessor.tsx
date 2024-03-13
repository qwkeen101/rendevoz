import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
import { useLayoutEffect, useMemo } from 'react'
import { useSetAtom } from 'jotai/index'
import { GroupStateAtom } from '@/core/components/group/hooks/useGroupState'
import { assignProperties } from '@/utils'
import { useMemoizedFn, useSelectAtomValue } from '@/hooks'
import _ from 'lodash'
import { useStore } from 'jotai'
import normalizeViewProperties from '@/core/components/group/utils/normalizeViewProperties'
import useGroupGetPropFromMeta from '@/core/components/group/hooks/useGroupGetPropFromMeta'
import { MetaGroup } from '~/typings'
import propertyIndexHelper from '@/core/components/group/hooks/dataTracker'
import useBuildGrouper from '@/core/components/group/hooks/grouper/useBuildGrouper'

export default ({ groupValue }: { groupValue?: MetaGroup }) => {
  const instance = useGroupInstance()
  const store = useStore()
  const setGroupState = useSetAtom(GroupStateAtom)
  const extraProperties = useSelectAtomValue(GroupStateAtom, s => s.state?.extraProperties)
  propertyIndexHelper()
  useBuildGrouper()
  assignProperties(instance, {
    updateGroupData: async data => {
      console.log('updated')
      if (groupValue) {
        const nextValue = data(groupValue)
        setGroupState(s => ({
          ...s,
          data: nextValue,
          currentView: nextValue.views?.find(i => i.id === nextValue.lastViewId) || nextValue.views?.[0]
        }))
        const res = await new Promise(res => {
          instance.on?.({
            type: 'groupDataChange',
            value: nextValue,
            onChange: g => res(g)
          })
        })
        if (!res) {
          throw new Error()
        }
        return res
      }
      throw new Error()
    }
  })

  useMemo(() => {
    if (groupValue) {
      if (groupValue !== store.get(GroupStateAtom).data) {
        normalizeViewProperties(groupValue, instance, extraProperties)
        setGroupState(s => ({ ...s, data: groupValue }))
      }
    }
  }, [groupValue])

  const compares = useMemoizedFn(() => {
    const currentView = store.get(GroupStateAtom).currentView
    if (groupValue?.views && currentView) {
      const targetView = groupValue.views.find(i => i.id === currentView.id)
      if (targetView) {
        if (!_.isEqual(targetView, currentView)) {
          setGroupState(s => ({ ...s, currentView: targetView }))
        }
      }
    }
  })

  useGroupGetPropFromMeta(instance)
  useLayoutEffect(() => {
    setTimeout(() => {
      compares()
    })
  }, [groupValue?.views])
  useLayoutEffect(() => {
    const currentView = store.get(GroupStateAtom).currentView
    if (groupValue?.lastViewId && !currentView) {
      setGroupState(s => ({ ...s, currentView: groupValue.views.find(i => i.id === groupValue.lastViewId) || groupValue.views[0] }))
    }
  }, [groupValue?.lastViewId])
  return null
}
