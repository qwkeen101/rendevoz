import { atom, useAtom, useSetAtom, useStore } from 'jotai'
import { IMediaState } from '~/typings'
import { useSelectAtomValue } from '@/hooks'

export type { IMediaState }

export const DEFAULT_MEDIA_STATE = {
  muted: false,
  loaded: false,
  loop: false,
  progressbarHovering: false,
  paused: true,
  volume: 0.3,
  speed: 1,
  fullScreen: false,
  windowed: false,
  cinemaMode: false,
  showSubtitle: true,
  mode: 'web',
  name: '',
  labelType: 'videoLabel',
  sidebarVisible: false,
  sidebarActive: 'ai',
  sidebarWidth: 400
} as IMediaState
export const MediaStateAtom = atom<IMediaState>(DEFAULT_MEDIA_STATE)
export const useSelectMediaState = <Slice>(slice: (v: IMediaState) => Slice, compare?: (prev: Slice, curr: Slice) => boolean) =>
  useSelectAtomValue<IMediaState, Slice>(MediaStateAtom, slice, { compare: compare ?? ((a, b) => a === b) })
export const useSetMediaState = () => useSetAtom(MediaStateAtom)
const useMediaState = () => useAtom(MediaStateAtom)
export const useGetMediaState = () => {
  const store = useStore()
  return () => store.get(MediaStateAtom)
}
export default useMediaState
