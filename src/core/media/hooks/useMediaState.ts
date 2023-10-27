import { atom, useAtom } from 'jotai'
import { IMediaState as I } from '~/typings'

export type IMediaState = I

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
  showSubtitle: true,
  mode: 'web',
  name: 'Unnamed media',
  labelType: 'videoLabel'
}
export const MediaStateAtom = atom<I>(DEFAULT_MEDIA_STATE)

const useMediaState = () => useAtom(MediaStateAtom)

export default useMediaState
