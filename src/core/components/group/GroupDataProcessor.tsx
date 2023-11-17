import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
import { useEffect, useLayoutEffect, useMemo } from 'react'
import { MetaStore, ObjectStore } from '@/api/stores'
import { useSetAtom } from 'jotai/index'
import { GroupStateAtom } from '@/core/components/group/hooks/useGroupState'
import { assignProperties } from '@/utils'
import { TabTitle } from '@/core/rendevoz/components'
import { Icon } from '@/components'
import { useMemoizedFn, useSelectAtomValue } from '@/hooks'
import _ from 'lodash'
import { useStore } from 'jotai'

export default ({ groupId }: { groupId: number }) => {
  const instance = useGroupInstance()
  const groupValue = ObjectStore('group').useValue(groupId)
  const groupMeta = MetaStore.useObjectToMetaValue(groupId)
  const store = useStore()
  const setGroupState = useSetAtom(GroupStateAtom)
  assignProperties(instance, {
    updateGroupData: async data => {
      if (groupValue) {
        const nextValue = data(groupValue)
        const res = await ObjectStore('group').updateOne({ ...nextValue })
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
      setGroupState(s => ({ ...s, data: groupValue }))
    }
  }, [groupValue])
  useLayoutEffect(() => {
    setGroupState(s => ({
      ...s,
      currentView: groupValue?.lastViewId ? groupValue.views.find(i => i.id === groupValue.lastViewId) : groupValue?.views[0]
    }))
  }, [groupValue?.lastViewId])
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
  useLayoutEffect(() => {
    setTimeout(() => {
      compares()
    })
  }, [groupValue?.views])
  return <TabTitle icon={<Icon name={'park-form'} />} title={groupMeta?.name || 'Unnamed group'} />
}
