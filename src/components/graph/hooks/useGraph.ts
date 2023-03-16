import { atom, useAtomValue } from 'jotai'
import D3GraphManager from '../D3GraphManager'

export const graphAtom = atom<D3GraphManager | null>(null)

const useGraph = () => useAtomValue(graphAtom)

export default useGraph
