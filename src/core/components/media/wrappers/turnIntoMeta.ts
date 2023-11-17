import { MediaProps } from '@/core'
import { ObjectStore } from '@/api/stores'

export default async (mediaState: MediaProps['mediaState'], type: 'audio' | 'video') => {
  if (!mediaState) return
  const { description, url, lastPlayedTime, totalPlayedTime, name, thumbnail, subtitleList, subtitleLang } = mediaState
  const res = await ObjectStore(type).addOneWithMeta(
    {
      url,
      lastPlayedTime,
      totalPlayedTime,
      subtitleList,
      thumbnail,
      subtitleLang: subtitleLang
    },
    {
      currentMeta: {
        name,
        description,
        coverImgSrc: thumbnail
      },
      silent: true
    }
  )
  return res
}
