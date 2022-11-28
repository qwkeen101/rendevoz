import { GraphScope } from '@/jotai/jotaiScope'
import { atom, useAtom } from 'jotai'
import { GraphEdge } from '../types/edge'

const edgesAtom = atom<GraphEdge[] | null>(null)

const useEdges = () => useAtom(edgesAtom, GraphScope)
export default useEdges
