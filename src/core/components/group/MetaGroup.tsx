import { Content } from '@/components'
import { GroupRenderer } from '@/core/components/group/GroupRenderer'
import GroupTitleRenderer from '@/core/components/group/GroupTitleRenderer'
import GroupActions from '@/core/components/group/GroupActions'
import { CSSProperties, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { Provider, createStore, useSetAtom, useStore } from 'jotai'
import { Group, PATH_TO_ELEMENT_MAP } from '@/core/components/group/hooks/weakmaps'
import { GroupInstanceAtom, useAssignGroupInstance, useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
import { IGroupInstance, IMetaProperty, MetaGroup as IMetaGroup, MetaGroupProperty, MetaObject } from '~/typings'
import GroupSidebarPeek from '@/core/components/group/components/basic/GroupSidebarPeek'
import GroupDragHandle from '@/core/components/group/GroupDragHandle'
import GroupSelectBox from '@/core/components/group/hooks/select/GroupSelectBox'
import GroupOpsAssigner from '@/core/components/group/GroupOpsAssigner'
import GroupDataProcessor from '@/core/components/group/GroupDataProcessor'
import GroupCenterRenderer from '@/core/components/group/GroupCenterRenderer'
import { useDebounceFn } from '@/hooks'
import { GroupStateAtom } from '@/core/components/group/hooks/useGroupState'
import GroupOverlay from '@/core/components/group/components/overlay/GroupOverlay'
import { IGroupEvent } from '~/typings/components/group/events'
import ReviewPanel from '@/core/components/group/components/review/ReviewPanel'
import { useMeasure } from 'react-use'
import { entries } from 'lodash'

export type IMetaGroupAvailableContextMenuItems =
  | 'deleteInGroup'
  | 'deleteCompleted'
  | 'deleteObject'
  | 'copyLinkToAll'
  | 'copyLink'
  | 'edit'
  | 'moveTo'
  | 'viewDetails'
  | 'addRowAbove'
  | 'addRowBelow'
  | 'openInSidePeek'
  | 'openInNewTab'
  | 'separator'
  | 'recover'
  | 'open'
export type IMetaGroupProps = {
  value?: IMetaGroup
  groupId?: number
  title?: {
    title?: string
    description?: string
    icon?: string
    titleEditable?: boolean
    descriptionEditable?: boolean
  }
  on?: (e: IGroupEvent) => void
  layout?: {
    showContains?: boolean
    showTitle?: boolean
    showActions?: boolean
    showSidebar?: boolean
    showDeletedMetas?: boolean
    showTitleActions?: boolean
    showDescription?: boolean
    showMultipleViews?: boolean
    showImport?: boolean
    showAddNew?: boolean
    showIcon?: boolean
    showAddObjectIntoSetting?: boolean
    // meta ids
    hideContextMenuItems?: IMetaGroupAvailableContextMenuItems[]
    contextMenu?: (currentSelected?: number[]) => IMetaGroupAvailableContextMenuItems[]
  }
  styles?: {
    bottomPadding?: number
    pagePaddingLeft?: number
    actionPaddingTop?: number
    containerStyle?: CSSProperties
    containerClassName?: string
  }
  onInstanceInitialized?: (i: IGroupInstance) => void
  state?: {
    canHideObjectsInside?: boolean
    canHideGroupsInside?: boolean
    deleteMetaWhenDeleteItem?: boolean
    canDrag?: boolean
    // id arr
    invisibleProperties?: number[]
    onlyCreateType?: MetaObject['type']
    canDragInside?: boolean
    addAfterCreateMeta?: boolean
    onlyOpenIn?: IMetaGroup['openIn']
    mustExistProperties?: number[]
    extraProperties?: MetaGroupProperty[]
  }
}
const MetaGroupInner = ({ value, groupId, layout, title, on, state, styles, onInstanceInitialized }: IMetaGroupProps) => {
  const instance = useGroupInstance()
  const containerRef = useRef<HTMLDivElement>(null)
  useAssignGroupInstance(instance)
  const store = useStore()
  const setGroupState = useSetAtom(GroupStateAtom)
  instance.on = on
  instance.getGroupState = () => store.get(GroupStateAtom)

  useMemo(() => {
    setGroupState(s => ({ ...s, layout, title, state, styles }))
  }, [layout, title, state, styles])

  useEffect(() => {
    if (instance) {
      if (containerRef.current) {
        instance.getOuterContainer = () => containerRef.current
      }
      Group.VALUE_TO_PARENT_MAP.set(instance, new Map())
      Group.ID_TO_PATH_MAP.set(instance, new Map())
      Group.ID_TO_VALUE_MAP.set(instance, new Map())
      PATH_TO_ELEMENT_MAP.set(instance, new Map())
      onInstanceInitialized?.(instance)
    }
  }, [instance])

  const container = containerRef.current
  if (container) {
    instance.values.pageContainer = container
    instance.getScrollElement = () => container
  }
  instance.getRealRowId = rowId => {
    const innerGroups = instance.getGroupState?.().groups
    if (innerGroups) {
      return instance.values.tempRowIdToRowIdMap.get(rowId) || rowId
    }
    return rowId
  }
  const v = value
  const debounceCancelScrolling = useDebounceFn(
    () => {
      setGroupState(s => ({ ...s, isScrollingBody: false }))
    },
    { wait: 200 }
  )
  useEffect(() => {
    const resizeObserver = new ResizeObserver(entries => {
      const width = entries[0].borderBoxSize[0].inlineSize
      containerRef.current?.style.setProperty('--group-width', `${width}px`)
    })
    const container = containerRef.current
    if (container) {
      resizeObserver.observe(container)
    }
    const clickHandler = (e: MouseEvent) => {
      const c = containerRef.current
      if (!c) return
      if (!instance.values.isFocused) return
      const t = e.target
      if (t instanceof Element) {
        if (document.querySelector('[role="click-cover"]')) return
        if (!c.contains(t)) {
          instance.values.isFocused = false
        }
      }
    }
    document.addEventListener('click', clickHandler)
    return () => {
      resizeObserver.disconnect()
      document.removeEventListener('click', clickHandler)
    }
  }, [])

  return (
    <>
      <GroupOpsAssigner bodyRef={containerRef} groupId={groupId} groupValue={v} />
      <GroupDataProcessor groupValue={v} />
      <Content
        tabIndex={0}
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
        className={styles?.containerClassName}
        style={{
          overflow: 'auto',
          overflowAnchor: 'none',
          scrollMargin: '30px',
          scrollPadding: '30px',
          '--page-padding-right': `${styles?.pagePaddingLeft ?? 60}px`,
          '--page-padding-left': `${styles?.pagePaddingLeft ?? 60}px`,
          '--bottom-padding': `${styles?.bottomPadding ?? 60}px`,
          ...styles?.containerStyle
        }}
        fullHeight
        ref={containerRef}
        fullWidth
        flex
        column
      >
        {layout?.showTitle !== false && (
          <GroupTitleRenderer groupValue={v} title={title?.title} description={title?.description} icon={title?.icon} />
        )}
        {layout?.showActions !== false && <GroupActions groupValue={v} />}
        <GroupRenderer />
      </Content>
      <GroupSidebarPeek />
      <GroupCenterRenderer />
      <GroupDragHandle bodyRef={containerRef} groupId={groupId} />
      <GroupOverlay />
      <ReviewPanel />
      <GroupSelectBox scrollContainerRef={containerRef} selectContainerRef={containerRef} />
    </>
  )
}

const MetaGroup = (props: IMetaGroupProps) => {
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
        pathRefs: new Set(),
        tempRowIdToRowIdMap: new Map()
      }
    } as IGroupInstance)
    return store
  }, [])
  return (
    <Provider store={store}>
      <MetaGroupInner {...props} />
    </Provider>
  )
}
export default MetaGroup
