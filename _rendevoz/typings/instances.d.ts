import { WebpageInnerRef } from '@/core/webpage/WebpageCore'
import { CustomEditor } from './editor'
import { Box, ILayoutTab, IWhiteboardEdge, IWhiteboardNode, MetaGroupChild, PartialWithId, TabData } from '..'

export interface WebpageInstance {
  transformToNote: () => Promise<CustomEditor>
  editor?: CustomEditor
  changeUrl: (url: string) => void
  webview?: WebpageInnerRef
}

export interface IWhiteboardInstance {
  // if true, opened, if false, not opened
  openTabInSidebar?: (tab: ILayoutTab) => ILayoutTab | undefined
  deleteNode: (nodeId: number) => void
  deleteEdge: (edgeId: number) => void
  deleteNodes: (nodeIds: number[]) => void
  insertNode: (node: Partial<IWhiteboardNode>) => Promise<IWhiteboardNode>
  updateEdge: (
    obj: PartialWithId<IWhiteboardEdge> | number,
    updater?: (curr: IWhiteboardEdge) => IWhiteboardEdge,
    withUndo?: boolean
  ) => Promise<void>
  updateNode: (
    obj: PartialWithId<IWhiteboardNode> | number,
    updater?: (curr: IWhiteboardNode) => IWhiteboardNode,
    withUndo?: boolean
  ) => Promise<void>
}

export type IReviewInstance = Partial<{
  createCard?: (rating: number) => void
  reviewCard?: () => void
  deleteCard?: () => void
}>

export type IMetaTableInstance = Partial<{
  startDrag: (metaId: number, rowNode: HTMLElement) => void
  update: (newValue: Partial<MetaGroupChild>, path: number[]) => void
  setDragHandle: (details: { path: number[]; node: HTMLElement; element: MetaGroupChild }) => void
  removeDragHandle: (path: number[]) => void
  setCurrentDragDetails: (
    details: { path: number[]; position: 'top' | 'bottom'; rowMetaId: number; rowNode: HTMLElement } | undefined
  ) => void
  getCurrentRows: () => MetaGroupChild[]
  scrollTable: (movement: { x?: number; y?: number }) => void
}>

export type IBaidudiskInstance = Partial<{
  // choose file, return file path or undefined
  chooseFile: (category?: number, closeAfterChoose?: boolean) => Promise<any | undefined>
  onChooseFile: (file: any) => void
}>
