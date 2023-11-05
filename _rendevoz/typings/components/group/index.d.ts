import { Box, MetaGroupChild, MetaObject, PartialWithId, MetaGroup } from '../..'
import { PrimitiveAtom } from 'jotai/esm'
import { Patch } from 'immer'
import { Path, PathRef } from 'slate'
import { Virtualizer } from '@tanstack/react-virtual'

export * from './group'

type GroupHistoryItem = {
  atom: PrimitiveAtom<any>
  patches: Patch[]
  inversePatches: Patch[]
  databaseName: string
}

type GroupRowFunctions = {
  checkIntersected: (box: Box) => boolean
  clearSelectState: VoidFunction
  select: VoidFunction
}

// auto scroll when dragging / selecting
type GroupBodyOps = {
  startDetectAutoScroll: VoidFunction
  endDetectAutoScroll: VoidFunction
  scrollBody: (movement: { x?: number; y?: number }) => void
}
type GroupTransformOps = {
  updateValue: (newValue: Partial<MetaGroupChild> & { rowId: number }) => void
}
type GroupDragOps = {
  setDragHandle: (details: { value: MetaGroupChild; node: HTMLElement }) => void
  removeDragHandle: VoidFunction
  setCurrentDragDetails: (details: { value: MetaGroupChild; towards: 'top' | 'bottom' | 'inner' } | undefined) => void
  startDrag: (details: { value: MetaGroupChild; node: HTMLElement }) => void
}

type GroupPathOps = {
  getPathById: (id: number, afterFilter?: boolean) => Path | undefined
  pathRef: (path: Path) => PathRef
}

type GroupMetaOps = {
  updateMeta: (nextMeta: PartialWithId<MetaObject>) => Promise<void>
  hasMetaInGroup: (metaId: number) => boolean
}

export type GroupValueEntry = [MetaGroupChild, Path]

type GroupValueOps = {
  getValueById: (id: number) => MetaGroupChild | undefined
  getValueByPath: (path: Path) => MetaGroupChild | undefined
  isParent: (maybeParent: MetaGroupChild, child: MetaGroupChild) => boolean
  updateValueByPath: (value: Partial<MetaGroupChild>, path: Path) => void
  // if no path, insert at end of group
  insertValueByPath: (value: Partial<MetaGroupChild> | Partial<MetaGroupChild>[], path?: Path) => void
  removeByPath: (path: Path) => void
  getVisibleValues: () => GroupValueEntry[]
  buildIndex: VoidFunction
  removeByPaths: (paths: Path[]) => void
  handleToggle: (rowId: number, toggled: boolean) => void
}

type GroupSelectOps = {
  clearAllSelect: VoidFunction
  selectAll: VoidFunction
  getSelectedItems: () => [MetaGroupChild, Path][]
  selectBetweenPath: (startPath: Path, endPath: Path) => void
}

type GroupSidebarOps = {
  open: (details: { type: 'preview'; metaId: number } | { type: 'labels'; objectId: number; objectType: string }) => void
}

export type IGroupInstance = Partial<{
  bodyOps: GroupBodyOps
  dragOps: GroupDragOps
  pathOps: GroupPathOps
  valueOps: GroupValueOps
  metaOps: GroupMetaOps
  selectOps: GroupSelectOps
  sidebarOps: GroupSidebarOps
  openObject: (metaId: number) => void
  triggerChange: VoidFunction
  openFilterPanel: VoidFunction
  getOuterContainer: () => HTMLElement
  getScrollElement: () => HTMLElement
  getScrollMargin: () => number
  deleteView: (viewId: number) => void
  updateCurrentView: (updater: (currentView: MetaGroup['views'][0]) => MetaGroup['views'][0]) => void
  updateGroupData: (updater: (currentData: MetaGroup) => MetaGroup) => Promise<MetaGroup>
  virtualizer: Virtualizer<any, any>
}> & {
  values: {
    redos: GroupHistoryItem[]
    undos: GroupHistoryItem[]
    isFocused: boolean
    currentInsertTarget?: {
      rowId: number
      direction: 'above' | 'below' | 'inner'
    }
    // id => row func
    inViewRowFuncs: Map<number, GroupRowFunctions>
    pathRefs: Set<PathRef>
    selectBox?: Box
    selectedRowIdSet: Set<number>
    currentValueIndex?: Record<number, number>
    currentIndex?: number[]
    currentValue: MetaGroupChild[]
    pageContainer?: HTMLElement
    // for shift multiple select
    lastSelectRowId?: number
    rowIdToRowMap: Map<number, MetaGroupChild & { path: Path }>
  }
}
