import { MediaProps } from '@/core'
import { ObjectStore } from '@/stores'

export default async (mediaState: MediaProps['mediaState'], type: 'audio' | 'video') => {
  if (!mediaState) return
  const { description, url, lastPlayedTime, totalPlayedTime, name, thumbnail, subtitleList } = mediaState
  const res = await ObjectStore(type).addOneWithMeta(
    {
      url,
      lastPlayedTime,
      totalPlayedTime,
      subtitleList,
      thumbnail
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
