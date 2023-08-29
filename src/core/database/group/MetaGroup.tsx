import { ObjectStore } from '@/stores'
import { MetaGroup } from '~/typings'
import { Content } from '@/components'
import InnerFilterer from '@/core/database/group/InnerFilterer'
import { GroupRenderer } from '@/core/database/group/GroupRenderer'
import GroupTitleRenderer from '@/core/database/group/GroupTitleRenderer'
import GroupActions from '@/core/database/group/GroupActions'
import { useEffect, useMemo } from 'react'
import { useStore } from 'jotai'
import { GroupAtomAtom } from '@/core/database/group/hooks/useTableState'
import { useTableInstance } from '@/core/database/group/hooks/useTableInstance'
import { PATH_TO_ELEMENT_MAP } from '@/core/database/group/hooks/weakmaps'
import useAssignTableInstance from '@/core/database/group/hooks/useAssignTableInstance'

const MetaGroupInner = ({ groupId }: { groupId: number }) => {
  const groupAtom = ObjectStore('group').createAtom(groupId)
  const store = useStore()
  const instance = useTableInstance()
  useAssignTableInstance(groupId)
  useEffect(() => {
    if (instance) {
      PATH_TO_ELEMENT_MAP.set(instance, new Map())
    }
  }, [instance])
  useMemo(() => {
    if (groupAtom) {
      store.set(GroupAtomAtom, groupAtom)
    }
  }, [groupAtom])
  return (
    <Content fullHeight fullWidth flex column style={{ padding: 40 }}>
      <GroupTitleRenderer groupId={groupId} />
      <GroupActions groupId={groupId} />
      <GroupRenderer groupId={groupId} />
    </Content>
  )
}

export default MetaGroupInner
