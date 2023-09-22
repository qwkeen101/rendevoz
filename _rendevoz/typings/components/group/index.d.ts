import { Box, MetaGroupChild, MetaObject, PartialWithId } from '../..'
import { PrimitiveAtom } from 'jotai/esm'
import { Patch } from 'immer'
import { Path, PathRef } from 'slate'

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
  getPathById: (id: number) => Path | undefined
  pathRef: (path: Path) => PathRef
}

type GroupMetaOps = {
  updateMeta: (nextMeta: PartialWithId<MetaObject>) => Promise<void>
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
}

export type IGroupInstance = Partial<{
  bodyOps: GroupBodyOps
  dragOps: GroupDragOps
  pathOps: GroupPathOps
  valueOps: GroupValueOps
  metaOps: GroupMetaOps
  triggerChange: VoidFunction
  getOuterContainer: () => HTMLElement
  getScrollElement: () => HTMLElement
}> & {
  values: {
    redos: GroupHistoryItem[]
    undos: GroupHistoryItem[]
    isFocused: boolean
    // id => row func
    inViewRowFuncs: Map<number, GroupRowFunctions>
    pathRefs: Set<PathRef>
    selectBox?: Box
    selectedRowIdSet: Set<number>
    currentValue: MetaGroupChild[]
    rowIdToRowMap: Map<number, MetaGroupChild & { path: Path }>
  }
}
