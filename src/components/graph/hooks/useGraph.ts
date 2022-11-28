import { GraphScope } from '@/jotai/jotaiScope'
import { atom, useAtom, useAtomValue } from 'jotai'
import D3GraphManager from '../D3GraphManager'

export const graphAtom = atom<D3GraphManager | null>(null)

const useGraph = () => useAtomValue(graphAtom, GraphScope)

export default useGraph