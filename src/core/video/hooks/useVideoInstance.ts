import { atom, useAtomValue } from 'jotai'
import { IVideoInstance } from '~/typings'

const VideoInstanceAtom = atom<Partial<IVideoInstance>>({})

export const useVideoInstance = () => useAtomValue(VideoInstanceAtom)
