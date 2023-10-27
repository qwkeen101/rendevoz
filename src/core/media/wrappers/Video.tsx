import { MetaStore, ObjectStore } from '@/stores'
import Media, { MediaProps } from '@/core/media'
import { saveImageLocally } from '@/utils'
import { normalizeSecondsToTime } from '@/core/media/utils'
import useMediaEventHandlerWrapper from '@/core/media/wrappers/eventHandler'
import useRealId from '@/core/media/wrappers/useRealId'

export default ({ videoId, ...rest }: { videoId: number } & MediaProps) => {
  const realId = useRealId('video', rest.mediaState?.url, videoId)
  const video = ObjectStore('video').useValue(realId)
  const videoMeta = MetaStore.useValue(MetaStore.useObjectToMetaValue(realId)?.id)
  if (!video?.url && video?.videoUrl) {
    ObjectStore('video').updateOne({ id: realId, url: video.videoUrl })
  }
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
