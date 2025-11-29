import { MetaStore, ObjectStore } from '@/api/stores'
import Media, { MediaProps } from '../index'
import useMediaEventHandlerWrapper from '@/core/components/media/wrappers/eventHandler'
import { useURLToId } from '@/api/indexData'

export default ({ audioId, ...rest }: { audioId?: number } & MediaProps) => {
  const realId = useURLToId(rest.mediaState?.url, audioId)
  const audio = ObjectStore('audio').useValue(realId)
  const audioMeta = MetaStore.useValue(MetaStore.useObjectToMetaValue(realId)?.id)
  const mediaState = {
    ...audio,
    url: audio?.url,
    defaultActiveSidebar: audio?.defaultActiveSidebar,
    defaultSidebarVisible: audio?.defaultSidebarVisible,
    thumbnail: audioMeta?.coverImgSrc,
    description: audioMeta?.description || rest.mediaState?.description || '',
    name: audioMeta?.name || '',
    labelType: 'audioLabel',
    isPinned: audioMeta?.pinned,
    mode: 'audio',
    metaId: audioMeta?.id,
    state: {
      episodeId: audio?.episodeId
    },
    onlyCore: rest.onlyCore,
    ...rest.mediaState
  }

  const eventHandler = useMediaEventHandlerWrapper({
    objectId: realId,
    type: 'audio',
    labelType: 'audioLabel',
    mediaState
  })
  if (realId && !audio) return null
  return (
    <Media
      {...rest}
      on={async e => {
        if (rest.on) {
          const res = await rest.on?.(e)
          if (res) return res
        }
        return await eventHandler(e)
      }}
      mediaState={mediaState}
    />
  )
}
