import { Content, Icon } from '@/components'
import { GroupRenderer } from '@/core/components/group/GroupRenderer'
import GroupTitleRenderer from '@/core/components/group/GroupTitleRenderer'
import GroupActions from '@/core/components/group/GroupActions'
import { useEffect, useMemo, useRef } from 'react'
import { Provider, createStore, useSetAtom } from 'jotai'
import { Group, PATH_TO_ELEMENT_MAP } from '@/core/components/group/hooks/weakmaps'
import { GroupInstanceAtom, useAssignGroupInstance, useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
import { IGroupInstance } from '~/typings'
import GroupSidebarPeek from '@/core/components/group/components/basic/GroupSidebarPeek'
import GroupDragHandle from '@/core/components/group/GroupDragHandle'
import GroupSelectBox from '@/core/components/group/GroupSelectBox'
import GroupOpsAssigner from '@/core/components/group/GroupOpsAssigner'
import GroupDataProcessor from '@/core/components/group/GroupDataProcessor'
import GroupCenterRenderer from '@/core/components/group/GroupCenterRenderer'
import { useDebounceFn } from '@/hooks'
import { GroupStateAtom } from '@/core/components/group/hooks/useGroupState'
import GroupOverlay from '@/core/components/group/components/overlay/GroupOverlay'
const MetaGroupInner = ({ groupId }: { groupId: number }) => {
  const instance = useGroupInstance()
  const containerRef = useRef<HTMLDivElement>(null)
  useAssignGroupInstance(instance)
  const setGroupState = useSetAtom(GroupStateAtom)
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

  const container = containerRef.current
  if (container) {
    instance.values.pageContainer = container
    instance.getScrollElement = () => container
  }
  const debounceCancelScrolling = useDebounceFn(
    () => {
      setGroupState(s => ({ ...s, isScrollingBody: false }))
    },
    { wait: 200 }
  )
  return (
    <>
      <GroupOpsAssigner bodyRef={containerRef} groupId={groupId} />
      <Content
        tabIndex={0}
        onBlur={() => {
          instance.values.isFocused = false
        }}
        onClick={() => {
          instance.values.isFocused = true
        }}
        onScroll={() => {
          setGroupState(s => (s.isScrollingBody ? s : { ...s, isScrollingBody: true }))
          debounceCancelScrolling.run()
        }}
        onFocus={e => {
          if (e.target === e.currentTarget) {
            instance.values.isFocused = true
          }
        }}
        style={{ overflow: 'auto', overflowAnchor: 'none' }}
        fullHeight
        ref={containerRef}
        fullWidth
        flex
        column
      >
        <GroupTitleRenderer groupId={groupId} />
        <GroupActions groupId={groupId} />
        <GroupRenderer />
      </Content>
      <GroupSidebarPeek />
      <GroupCenterRenderer />
      <GroupDataProcessor groupId={groupId} />
      <GroupDragHandle bodyRef={containerRef} groupId={groupId} />
      <GroupOverlay />
      <GroupSelectBox scrollContainerRef={containerRef} selectContainerRef={containerRef} />
    </>
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
        inViewRowFuncs: new Map(),
        pathRefs: new Set()
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
