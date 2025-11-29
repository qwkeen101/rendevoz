import { atom, useAtom, useSetAtom, useStore } from 'jotai'
import { GraphNode } from '../types/node'
import { SetStateAction } from 'react'

export const GraphNodesAtom = atom<GraphNode[]>([])

export const GraphNodesMapAtom = atom(get => new Map(get(GraphNodesAtom)?.map(i => [i.id, i])))
const useGraphNodes = () => useAtom(GraphNodesAtom)

export const useGraphStaticNodes = () => {
  const store = useStore()
  const setNodes = useSetAtom(GraphNodesAtom)
  return [() => store.get(GraphNodesAtom), setNodes] as [() => GraphNode[], typeof setNodes]
}
export default useGraphNodes
