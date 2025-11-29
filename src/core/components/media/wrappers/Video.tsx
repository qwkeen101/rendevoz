import { MetaStore, ObjectStore } from '@/api/stores'
import Media, { MediaProps } from '@/core/components/media'
import useMediaEventHandlerWrapper from '@/core/components/media/wrappers/eventHandler'
import { useURLToId } from '@/api/indexData'
import { IMediaState } from '~/typings'

export default ({ videoId, ...rest }: { videoId: number } & MediaProps) => {
  const realId = useURLToId(rest.mediaState?.url, videoId)
  const video = ObjectStore('video').useValue(realId)
  const videoMeta = MetaStore.useValue(MetaStore.useObjectToMetaValue(realId)?.id)
  const externalMediaState = rest.mediaState
  const mediaState: IMediaState = {
    ...video,
    ...externalMediaState,
    state: {
      ytPlaylistId: video?.ytPlaylistId,
      ytChannelId: video?.ytChannelId,
      ytVideoId: video?.ytVideoId,
      ...externalMediaState?.state
    },
    defaultSidebarVisible: video?.defaultSidebarVisible,
    defaultActiveSidebar: video?.defaultActiveSidebar,
    url: video?.url || externalMediaState?.url,
    description: videoMeta?.description || externalMediaState?.description || '',
    name: videoMeta?.name || externalMediaState?.name || '',
    labelType: 'videoLabel',
    isPinned: videoMeta?.pinned,
    metaId: videoMeta?.id
  }
  const eventHandler = useMediaEventHandlerWrapper({
    objectId: realId,
    type: 'video',
    labelType: 'videoLabel',
    mediaState
  })
  if (realId && !video) return null
  return (
    <Media
      {...rest}
      on={async e => {
        const res = await rest?.on?.(e)
        if (res === true) return
        return await eventHandler(e)
      }}
      mediaState={mediaState}
    />
  )
}
