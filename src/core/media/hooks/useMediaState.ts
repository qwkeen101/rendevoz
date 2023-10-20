import { atom, useAtom } from 'jotai'
import { IMediaState as I } from '~/typings'

export type IMediaState = I

export const MediaStateAtom = atom<I>({
  muted: false,
  loaded: false,
  loop: false,
  progressbarHovering: false,
  paused: true,
  volume: 0.3,
  speed: 1,
  fullScreen: false,
  windowed: false,
  showSubtitle: true,
  mode: 'web',
  name: 'Unnamed media',
  labelType: 'videoLabel'
})

const useMediaState = () => useAtom(MediaStateAtom)

export default useMediaState
