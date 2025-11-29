import { useParams } from 'react-router-dom'
import { ObjectStore } from '@/api/stores'
import { Fragment, memo, useLayoutEffect, useMemo, useRef } from 'react'
import YoutubeItemsContainer from '@/core/components/feed/youtube/YoutubeItemsContainer'
import { Button, useElementScrollRestore } from '@/components'
import { Icons } from '@/consts'
import useFeedInstance from '@/core/components/feed/hooks/useFeedInstance'
import { useUpdate } from 'react-use'
import { useTranslation } from 'react-i18next'
import trans from '@/consts/trans'
import { useNorepeatNavigate } from '@/hooks'
import YoutubeLibraryRenderer from '@/core/components/feed/youtube/YoutubeLibraryRenderer'

export default memo(() => {
  const { id } = useParams()
  const folder = ObjectStore('youtubeFolder').useValue(Number(id))
  const { items } = folder || {}
  const categorized = useMemo(() => {
    if (!items) {
      return {
        videos: [],
        playlists: [],
        channels: []
      }
    }
    return {
      videos: items.filter(i => i.type === 'video').map(i => i.id),
      playlists: items.filter(i => i.type === 'playlist').map(i => i.id),
      channels: items.filter(i => i.type === 'channel').map(i => i.id)
    }
  }, [items])

  return (
    <YoutubeLibraryRenderer
      cacheKey={`youtube_folder_${id}`}
      videoIds={categorized.videos}
      playlistIds={categorized.playlists}
      channelIds={categorized.channels}
      parentFolderId={Number(id)}
      name={folder?.name || 'Unnamed folder'}
    />
  )
})
