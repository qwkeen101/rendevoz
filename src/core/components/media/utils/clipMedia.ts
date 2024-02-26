import { FFmpeg } from '@ffmpeg/ffmpeg'
import { toBlobURL } from '@ffmpeg/util'
const sToT = (s: number) => {
  const d = new Date(0)
  d.setSeconds(s)
  return d.toISOString().substring(11, 19)
}
export default async (
  name: string,
  file: Blob,
  // seconds
  time: {
    start: number
    end: number
  }
) => {
  const f = new FFmpeg()
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm'
  await f.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm')
  })
  await f.writeFile(name, new Uint8Array(await file.arrayBuffer()))
  await f.exec(['-ss', `${sToT(time.start)}`, '-to', `${sToT(time.end)}`, '-i', name, '-c', 'copy', 'output.mp4'])
  const data = await f.readFile('output.mp4')

  return new Blob([data], { type: 'video/mp4' })
}
