export type IYoutubeCaptionTrack = {
  baseUrl: string
  isTranslatable: boolean
  languageCode: string
  name: {
    simpleText: string
  }
  trackName: string
  vssId: string
}
import he from 'he'
import { find } from 'lodash'
import striptags from 'striptags'

export default async (videoId: string): Promise<IYoutubeCaptionTrack[]> => {
  const website = await fetch(`https://youtube.com/watch?v=${videoId}`).then(res => res.text())
  if (!website.includes('captionTracks')) return Promise.reject()
  const regex = /"captionTracks":(\[.*?\])/
  const [match] = regex.exec(website)

  const { captionTracks } = JSON.parse(`{${match}}`)
  return captionTracks
}

export const YoutubeCaptionParser = (data: string) => {
  const lines = data
    .replace('<?xml version="1.0" encoding="utf-8" ?><transcript>', '')
    .replace('</transcript>', '')
    .split('</text>')
    .filter(line => line && line.trim())
    .map(line => {
      const startRegex = /start="([\d.]+)"/
      const durRegex = /dur="([\d.]+)"/

      const [, start] = startRegex.exec(line)
      const [, dur] = durRegex.exec(line)

      const htmlText = line
        .replace(/<text.+>/, '')
        .replace(/&amp;/gi, '&')
        .replace(/<\/?[^>]+(>|$)/g, '')

      const decodedText = he.decode(htmlText)
      const text = striptags(decodedText)
      const nStart = Number(parseFloat(start).toFixed(2))
      const nDur = Number(parseFloat(dur).toFixed(2))
      return {
        start: nStart,
        end: Number(parseFloat(nStart + nDur).toFixed(2)),
        text: text.replace(/(\r\n|\n|\r)/gm, ' ')
      }
    })
  return lines
}
