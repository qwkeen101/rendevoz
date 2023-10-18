import { Descendant, NodeEntry, Operation, Path, PathRef } from 'slate'
import { CustomEditor, CustomElement, ElementFunctions, INoteLabel } from '.'
import { CustomText, EmptyText } from '.'
import { EditorOverlayManager } from '../../../../src/core/editor/components/overlay/useEditorOverlay'

export type IEditorInstance = Partial<{
  getTitle: () => string
  scrollToBlock: (options: { blockId?: number }) => Promise<void>
  selectBlock: (options: { blockId?: number }) => Promise<void>
  scrollToHighlight: (options: { highlightId: number }) => Promise<void>
  getSlateEditor: () => CustomEditor
  isSelectionCollapsed?: () => boolean
  indexPath: VoidFunction
  getScrollPosition: () => number
  scrollToPosition: (offset: number) => void
  blockOps: {
    // if has selected, delete selected, else delete target path
    deleteBlock: (path?: Path) => void
    getAboveBlock: () => [CustomElement, Path] | undefined
    isIndentableBlock: (type: string) => boolean
    insertBlockIndent: (path: Path, recursive?: boolean) => void
    minusBlockIndent: (path: Path, recursive?: boolean) => void
    transformBlockType: (path: Path, newType: string) => void
  }
  toggleOps: {
    haveToggledChildren: (path: Path) => boolean
    toggleBlock: (path: Path) => void
    untoggleBlock: (path: Path) => void
    deleteToggledBlock: (path: Path) => void
    isTogglableElement: (element: CustomElement) => boolean
    findAllPossibleChildrenNodes: (path: Path) => [CustomElement, Path][] | undefined
    // 如果节点未折叠，返回此节点，如果已折叠，返回被这个节点折叠的节点
    getUnderNodes: (path: Path) => [CustomElement, Path][]
    getFoldedOffsetPath: (path: Path) => Path
    extendElements: (elements: CustomElement | CustomElement[]) => [CustomElement, Path][]
  }
  textOps: {
    // get text before selection anchor
    getBeforeText: (distance: number, unit?: 'character' | 'word') => string | undefined
  }
  labelOps: {
    addLabel: (label: Partial<INoteLabel>) => Promise<INoteLabel | void>
    deleteLabel: (id: number) => Promise<void>
    toggleLabel: VoidFunction
    scrollToLabel: (labelId: number) => void
  }
  searchOps: {
    openSearch: VoidFunction
    closeSearch: VoidFunction
    toggleSearch: VoidFunction
    search: (query: string, reset?: boolean) => [number, string][]
    pureSearch: (query: string, reset?: boolean) => [number, string][]
    getOccurrences: (query: string) => number
    replace: (source: string, target: string, replaceCurrent?: boolean) => void
    changeOccurrence: (direction: 'up' | 'down') => void
  }
  replaceChildren: (newValue: Descendant[], restoreScrollPosition?: boolean) => void
  save: VoidFunction
  toggleLeftBar: VoidFunction
  openSetting: VoidFunction
  closeSetting: VoidFunction
  toggleSetting: VoidFunction
  printToPDF: VoidFunction
  applyOperation: (operation: Operation, debounce?: boolean) => void
  getScrollElement: () => HTMLElement | undefined | null
  getHighlightLocation: (highlightId: number) => NodeEntry<CustomText | EmptyText>[]
  getOverlayManager: () => EditorOverlayManager
  /**
   * Get element path by its id
   */
  getElementPathById: (id: number) => Path | undefined
  getSelectedElements: () => CustomElement[]
  getElementFunctionById: (id: number) => ElementFunctions | undefined
}> & {
  values: {
    selectingAll?: boolean
    // indicator's path and element are safe to use
    indicator?: {
      direction: 'left' | 'top' | 'bottom' | 'right'
      isNested?: boolean
      element: CustomElement
      path: Path
    }
    // selected id to element and pathRef map
    selectedBlocks: Map<
      number,
      {
        element: CustomElement
        // we use path ref to track its path, this is expensive, unref it asap
        pathRef?: PathRef
        removeSelectedState?: VoidFunction
        node?: HTMLElement | null
      }
    >
  }
}
