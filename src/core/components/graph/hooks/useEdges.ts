import { atom, useAtom } from 'jotai'
import { GraphEdge } from '../types/edge'

export const GraphEdgesAtom = atom<GraphEdge[]>([])

const useEdges = () => useAtom(GraphEdgesAtom)

export default useEdges
