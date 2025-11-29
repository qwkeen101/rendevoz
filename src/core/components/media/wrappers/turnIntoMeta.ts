import { MediaProps } from '@/core'
import { ObjectStore } from '@/api/stores'

export default async (mediaState: MediaProps['mediaState'], type: 'audio' | 'video', temp?: boolean) => {
  if (!mediaState) return
  const { description, url, currentTime, name, thumbnail, subtitleList, subtitleLang, state } = mediaState
  const res = await ObjectStore(type).addOneWithMeta(
    {
      url,
      currentTime,
      subtitleList,
      thumbnail,
      subtitleLang: subtitleLang,
      episodeId: state?.episodeId,
      ytChannelId: state?.ytChannelId,
      ytVideoId: state?.ytVideoId,
      ytPlaylistId: state?.ytPlaylistId
    },
    {
      currentMeta: {
        name,
        temp,
        description,
        coverImgSrc: thumbnail
      },
      silent: true
    }
  )
  return res
}
