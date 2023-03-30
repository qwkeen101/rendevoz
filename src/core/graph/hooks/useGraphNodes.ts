import { atom, useAtom } from 'jotai'
import { GraphNode } from '../types/node'

export const GraphNodesAtom = atom<GraphNode[] | null>(null)

const useGraphNodes = () => useAtom(GraphNodesAtom)

export default useGraphNodes
