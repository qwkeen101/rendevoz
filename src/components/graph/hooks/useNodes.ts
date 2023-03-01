import { atom, useAtom } from 'jotai'
import { GraphNode } from '../types/node'

const nodesAtom = atom<GraphNode[] | null>(null)

const useNodes = () => useAtom(nodesAtom)

export default useNodes
