import requestVideoSubtitle from '@/api/components/objectImporter/baidudisk/requestVideoSubtitle'
import toWebVTT from 'srt-webvtt'

export default async (url: string) => {
  const path = url.replace('baidudisk', '')
  try {
    const info = await requestVideoSubtitle(path, false)
    if (info) {
      const lines = info.split(/[\r\n]/)
      if (lines[1] === '#MEDIA:SUBTITLES') {
        lines.shift()
        lines.shift()
        const subtitles = []
        lines.forEach((l, index, array) => {
          if (l.startsWith('#EXT-X-MEDIA')) {
            const downloadlink = array[index + 1]
            const lang = l
              .split(',')
              .find(i => i.startsWith('LANGUAGE'))
              .split('=')[1]
              .replaceAll('"', '')
            subtitles.push({
              lang,
              url: downloadlink
            })
          }
        })
        const result = await Promise.all(
          subtitles.map(async i => {
            const file = await (await fetch(i.url)).blob()
            const vttFileUrl = await toWebVTT(file)
            return {
              lang: i.lang,
              url: vttFileUrl
            }
          })
        )
        return result
      }
    }
  } catch (e) {}
}
