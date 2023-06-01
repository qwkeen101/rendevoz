export type IVideoInstance = {
  play: VoidFunction
  pause: VoidFunction
  // second
  jumpTo: (time: number) => void
  mute: VoidFunction
  unmute: VoidFunction
  loop: VoidFunction
  unloop: VoidFunction
  getUrl: () => string | undefined
  getVideoElement: () => HTMLVideoElement | undefined
  getOffscreenVideo: () => HTMLVideoElement | undefined
}
