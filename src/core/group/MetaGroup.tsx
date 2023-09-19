import { ObjectStore } from '@/stores'
import { Content } from '@/components'
import { GroupRenderer } from '@/core/group/GroupRenderer'
import GroupTitleRenderer from '@/core/group/GroupTitleRenderer'
import GroupActions from '@/core/group/GroupActions'
import { useEffect, useMemo, useRef } from 'react'
import { useStore, Provider, createStore } from 'jotai'
import { GroupAtomAtom } from '@/core/group/hooks/useTableState'
import { Group, PATH_TO_ELEMENT_MAP } from '@/core/group/hooks/weakmaps'
import useAssignTableInstance from '@/core/group/hooks/useAssignTableInstance'
import { GroupInstanceAtom, useGroupInstance } from '@/core/group/hooks/useGroupInstance'
import useGroupHistory from '@/core/group/hooks/useGroupHistory'
import { IGroupInstance } from '~/typings'
import GroupOverlay from '@/core/group/GroupOverlay'
import useAssignPathOps from '@/core/group/hooks/ops/useAssignPathOps'
import useGroupDrag from '@/core/group/hooks/drag/useGroupDrag'
import useBuildInGroupIndex from '@/core/group/hooks/ops/useBuildInGroupIndex'
import useAssignValueOps from '@/core/group/hooks/ops/useAssignValueOps'
import useGroupGlobalKey from '@/core/group/hooks/keyboard/useGroupGlobalKey'
import useAssignMetaOps from '@/core/group/hooks/ops/useAssignMetaOps'

const MetaGroupInner = ({ groupId }: { groupId: number }) => {
  const groupAtom = ObjectStore('group').createAtom(groupId)
  const store = useStore()
  const instance = useGroupInstance()
  const containerRef = useRef<HTMLDivElement>(null)
  const groupValue = ObjectStore('group').useValue(groupId)
  useAssignTableInstance(groupId)
  useGroupHistory()
  useBuildInGroupIndex(groupId)
  useAssignValueOps(instance, groupValue?.value, groupId)
  useAssignPathOps(instance)
  useAssignMetaOps(instance)
  useGroupGlobalKey()
  const { renderHandle } = useGroupDrag({
    groupId,
    bodyRef: containerRef
  })
  useEffect(() => {
    if (instance) {
      if (containerRef.current) {
        instance.getOuterContainer = () => containerRef.current
      }
      Group.VALUE_TO_PARENT_MAP.set(instance, new Map())
      Group.ID_TO_PATH_MAP.set(instance, new Map())
      Group.ID_TO_VALUE_MAP.set(instance, new Map())
      PATH_TO_ELEMENT_MAP.set(instance, new Map())
    }
  }, [instance])
  useMemo(() => {
    if (groupAtom) {
      store.set(GroupAtomAtom, groupAtom)
    }
  }, [groupAtom])
  return (
    <Content
      tabIndex={0}
      onBlur={() => {
        instance.values.isFocused = false
      }}
      onClick={() => {
        instance.values.isFocused = true
      }}
      fullHeight
      ref={containerRef}
      fullWidth
      flex
      column
    >
      <GroupTitleRenderer groupId={groupId} />
      <GroupActions groupId={groupId} />
      <div
        onClick={() => {
          console.log(instance.values.undos)
        }}
      >
        show undos
      </div>
      <GroupOverlay />
      <GroupRenderer groupId={groupId} />
      {renderHandle()}
    </Content>
  )
}

const MetaGroup = ({ groupId }: { groupId: number }) => {
  const store = useMemo(() => {
    const store = createStore()
    store.set(GroupInstanceAtom, {
      values: {
        redos: [],
        undos: [],
        isFocused: false,
        selectedRowIdSet: new Set(),
        rowIdToPathMap: new Map(),
        inViewRowFuncs: new Map()
      }
    } as IGroupInstance)
    return store
  }, [])
  return (
    <Provider store={store}>
      <MetaGroupInner groupId={groupId} />
    </Provider>
  )
}
export default MetaGroup
