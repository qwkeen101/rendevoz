import LocalMicrosoftTranslate from '@/utils/translate'

export default async (subtitles: { text: string }[]) => {
  const result = await LocalMicrosoftTranslate(subtitles.map(i => ({ Text: i.text })))
  return result
}
