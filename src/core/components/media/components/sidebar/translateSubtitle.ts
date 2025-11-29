import TranslateService from '@/api/services/translate.service'

export default async (subtitles: { text: string }[], onLoad: (res: { text: string; id: number }[]) => void) => {
  const chunked = TranslateService.chunkJSON(subtitles.map((i, idx) => ({ text: i.text, id: idx })))
  await Promise.allSettled(
    chunked.map(async c => {
      const result = await TranslateService.translateJSON(c.items, c.context.slice(-200))
      onLoad(result)
    })
  )
}
