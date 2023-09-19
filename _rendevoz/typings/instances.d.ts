import { WebpageInnerRef } from '@/core/webpage/WebpageCore'
import { CustomEditor } from './editor'
import { Box, ILayoutTab, IWhiteboardEdge, IWhiteboardNode, MetaGroupChild, PartialWithId, TabData } from '..'
import { PrimitiveAtom } from 'jotai'
import { Patch } from 'immer'
import { Path } from 'slate'

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


export type IBaidudiskInstance = Partial<{
  // choose file, return file path or undefined
  chooseFile: (category?: number, closeAfterChoose?: boolean) => Promise<any | undefined>
  onChooseFile: (file: any) => void
}>
