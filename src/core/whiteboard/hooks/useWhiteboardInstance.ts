import { atom, useAtomValue } from 'jotai'
import { IWhiteboardInstance } from '~/typings'

export const WhiteboardInstanceAtom = atom<Partial<IWhiteboardInstance>>({})

export const useWhiteboardInstance = () => useAtomValue(WhiteboardInstanceAtom)
