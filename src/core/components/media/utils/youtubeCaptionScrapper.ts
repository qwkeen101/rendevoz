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

export default async (videoId: string): Promise<IYoutubeCaptionTrack[]> => {
  const videoDetails = await fetch(`https://www.youtube.com/youtubei/v1/player`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      videoId: videoId,
      context: {
        client: {
          clientName: 'ANDROID',
          clientVersion: '20.10.38'
        }
      }
    })
  }).then(i => i.json())
  return videoDetails.captions.playerCaptionsTracklistRenderer.captionTracks.map(i => ({
    ...i,
    name: {
      simpleText: i.name?.runs[0]?.text
    }
  }))
}

function parseSRT(srtText: string) {
  const entries = []
  const blocks = srtText.split(/\r?\n\r?\n/) // 按空行分块（每条字幕）

  for (const block of blocks) {
    const lines = block.trim().split(/\r?\n/)
    if (lines.length >= 2) {
      const timeMatch = lines[1].match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})\s+-->\s+(\d{2}):(\d{2}):(\d{2}),(\d{3})/)
      if (!timeMatch) continue

      const start = parseInt(timeMatch[1]) * 3600 + parseInt(timeMatch[2]) * 60 + parseInt(timeMatch[3]) + parseInt(timeMatch[4]) / 1000

      const end = parseInt(timeMatch[5]) * 3600 + parseInt(timeMatch[6]) * 60 + parseInt(timeMatch[7]) + parseInt(timeMatch[8]) / 1000

      const text = lines.slice(2).join('\n') // 支持多行字幕
      entries.push({ start, end, text })
    }
  }

  return entries
}

export const YoutubeCaptionParser = (data: string) => {
  return parseSRT(data)
}
