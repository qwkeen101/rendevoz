import { MetaStore, ObjectStore } from '@/api/stores'
import Media, { MediaProps } from '@/core/components/media'
import { saveImageLocally } from '@/utils'
import useMediaEventHandlerWrapper from '@/core/components/media/wrappers/eventHandler'
import { useURLToId } from '@/api/indexData'

export default ({ videoId, ...rest }: { videoId: number } & MediaProps) => {
  const realId = useURLToId(rest.mediaState?.url, videoId)
  const video = ObjectStore('video').useValue(realId)
  const videoMeta = MetaStore.useValue(MetaStore.useObjectToMetaValue(realId)?.id)
  const externalMediaState = rest.mediaState
  const mediaState = {
    ...video,
    ...externalMediaState,
    url: video?.url || externalMediaState?.url,
    description: videoMeta?.description || externalMediaState?.description,
    name: videoMeta?.name || externalMediaState?.name || 'Unnamed video',
    labelType: 'videoLabel',
    isPinned: videoMeta?.pinned,
    metaId: videoMeta?.id
  }
  console.log(video)
  const eventHandler = useMediaEventHandlerWrapper({
    objectId: realId,
    type: 'video',
    labelType: 'videoLabel',
    mediaState
  })
  return (
    <Media
      {...rest}
      on={async e => {
        console.log(e)
        switch (e.type) {
          case 'addScreenshot': {
            const path = await saveImageLocally(e.imageDataUrl)
            ObjectStore('image').addOneWithMeta(
              {
                imageUrl: path
              },
              {
                showMetaModal: false,
                currentMeta: {
                  name: 'Video screenshot',
                  coverImgSrc: path,
                  fromObject: videoMeta
                    ? {
                        metaId: videoMeta.id,
                        type: 'video'
                      }
                    : undefined
                }
              }
            )
            return
          }
        }
        return await eventHandler(e)
      }}
      mediaState={mediaState}
    />
  )
}
