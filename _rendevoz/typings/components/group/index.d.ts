import {
  Box,
  MetaGroupChild,
  MetaObject,
  PartialWithId,
  MetaGroup,
  IMetaProperty,
  MetaGroupProperty,
  MetaGroupViewProperty,
  IMetaProp
} from '../..'
import { PrimitiveAtom } from 'jotai/esm'
import { Patch } from 'immer'
import { Path, PathRef } from 'slate'
import { Virtualizer } from '@tanstack/react-virtual'
import { XYPosition } from 'rendevoz'

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
  updateMetaProperty: (field: string, nextValue: any, id?: number) => Promise<void>
}

export type GroupValueEntry = [MetaGroupChild, Path]

type GroupValueOps = {
  getPrevMeta: (
    rowId: number,
    opts?: {
      loop?: boolean
      canPreview?: boolean
    }
  ) =>
    | {
        metaId: number
        rowId: number
      }
    | undefined
  getNextMeta: (
    rowId: number,
    opts?: {
      loop?: boolean
      canPreview?: boolean
    }
  ) =>
    | {
        metaId: number
        rowId: number
      }
    | undefined
  getValueById: (id: number) => MetaGroupChild | undefined
  getValueByPath: (path: Path) => MetaGroupChild | undefined
  // visible and invisible
  getAllMetasInGroup: () => MetaObject[]
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
  selectItem: (id: number, removeOtherIfOnlyOneSelected?: boolean) => void
  clearAllSelect: VoidFunction
  selectAll: VoidFunction
  getSelectedItems: () => [MetaGroupChild, Path][]
  selectBetweenPath: (startPath: Path, endPath: Path) => void
}

type GroupSidebarOps = {
  open: (details: { type: 'preview'; metaId: number } | { type: 'labels'; objectId: number; objectType: string }) => void
}

type GroupCenterOps = {
  open: (metaId: number, rowId: number) => void
}

type GroupViewOps = {
  getVisibleProperties: () => MetaGroupProperty[] | undefined
  useViewProperties: () => MetaGroupProperty[] | undefined
  changePropertyName: (id: number, newName: string) => Promise<void>
  updateProperty: (id: number, newProp: Partial<MetaGroupViewProperty>) => Promise<void>
  addNewProperty: (prop: Partial<IMetaProp>) => void
  deleteCustomProperty: (id: number, deleteMetaProp?: boolean) => Promise<void>
  tableOps?: {
    deselectCell: VoidFunction
    useSelectedCell: (rowId: number, index: number) => boolean
    selectCell: (rowId: number, index: number) => void
    getCurrentSelectedCell: () =>
      | {
          rowId: number
          index: number
        }
      | undefined
    // navigate to next cell
    navigateCell: (direction: 'up' | 'down' | 'right' | 'left') => void
  }
}

export type GroupOverlayAvaibleContents = {
  type: 'itemContextMenu'
  details: MetaGroupChild
  align?: 'start' | 'center'
}

type GroupOverlayOps = {
  open: (content: GroupOverlayAvaibleContents, position: XYPosition) => void
}

export type IGroupInstance = Partial<{
  bodyOps: GroupBodyOps
  dragOps: GroupDragOps
  pathOps: GroupPathOps
  valueOps: GroupValueOps
  metaOps: GroupMetaOps
  selectOps: GroupSelectOps
  sidebarOps: GroupSidebarOps
  centerOps: GroupCenterOps
  overlayOps: GroupOverlayOps
  openObject: (metaId: number, rowId: number) => void
  triggerChange: VoidFunction
  openFilterPanel: VoidFunction
  getOuterContainer: () => HTMLElement
  getScrollElement: () => HTMLElement
  getScrollMargin: () => number
  viewOps: GroupViewOps
  deleteView: (viewId: number) => void
  updateCurrentView: (updater: (currentView: MetaGroup['views'][0]) => MetaGroup['views'][0]) => void
  updateGroupData: (updater: (currentData: MetaGroup) => MetaGroup) => Promise<MetaGroup>
  getCurrentView: () => MetaGroup['views'][0] | undefined
  getGroupData: () => MetaGroup | undefined
  virtualizer: Virtualizer<any, any>
  buildIndex: VoidFunction
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
    currentValue?: MetaGroupChild[]
    pageContainer?: HTMLElement
    // for shift multiple select
    lastSelectRowId?: number
    rowIdToRowMap: Map<number, MetaGroupChild & { path: Path }>
  }
}
