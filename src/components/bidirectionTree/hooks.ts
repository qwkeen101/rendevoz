import { useAtomValue, useSetAtom } from 'jotai/react'
import { atom } from 'jotai/vanilla'
import FlowManager from './FlowManager'
import { ITreeEdge, ITreeNode } from './types'

const TreeNodesAtom = atom(new Map<number, ITreeNode>())

const TreeEdgesAtom = atom(new Map<number, ITreeEdge>())

export const FlowAtom = atom<FlowManager | null>(null)
export const useTreeNodes = () => useAtomValue(TreeNodesAtom)

export const useSetTreeNodes = () => useSetAtom(TreeNodesAtom)

export const useTreeEdges = () => useAtomValue(TreeEdgesAtom)

export const useSetTreeEdges = () => useSetAtom(TreeEdgesAtom)

export const useFlow = () => useAtomValue(FlowAtom)