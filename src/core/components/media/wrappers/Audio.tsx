import { MetaStore, ObjectStore } from '@/api/stores'
import Media, { MediaProps } from '../index'
import useRealId from '@/core/components/media/wrappers/useRealId'
import useMediaEventHandlerWrapper from '@/core/components/media/wrappers/eventHandler'

export default ({ audioId, ...rest }: { audioId?: number } & MediaProps) => {
  const realId = useRealId('audio', rest.mediaState?.url, audioId)
  const audio = ObjectStore('audio').useValue(realId)
  const audioMeta = MetaStore.useValue(MetaStore.useObjectToMetaValue(realId)?.id)
  console.log(audio, rest)
  const mediaState = {
    ...audio,
    url: audio?.url,
    description: audioMeta?.description || rest.mediaState?.description,
    name: audioMeta?.name || 'Unnamed audio',
    labelType: 'audioLabel',
    isPinned: audioMeta?.pinned,
    mode: 'audio',
    metaId: audioMeta?.id,
    onlyCore: rest.onlyCore,
    ...rest.mediaState
  }

  const eventHandler = useMediaEventHandlerWrapper({
    objectId: realId,
    type: 'audio',
    labelType: 'audioLabel',
    mediaState
  })
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
