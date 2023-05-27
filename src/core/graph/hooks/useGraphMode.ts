import { atom, useAtom } from 'jotai'

export const GraphModeAtom = atom<'simple' | 'normal'>('normal')

const useGraphMode = () => useAtom(GraphModeAtom)

export default useGraphMode
