import { MetaStore, ObjectStore } from '@/stores'
import Media, { MediaProps } from '@/core/media'
import { saveImageLocally } from '@/utils'
import { normalizeSecondsToTime } from '@/core/media/utils'
import useMediaEventHandlerWrapper from '@/core/media/wrappers/eventHandler'

export default ({ videoId, ...rest }: { videoId: number } & MediaProps) => {
  const video = ObjectStore('video').useValue(videoId)
  const videoMeta = MetaStore.useValue(MetaStore.useObjectToMetaValue(videoId)?.id)
  if (!video?.url && video?.videoUrl) {
    ObjectStore('video').updateOne({ id: videoId, url: video.videoUrl })
  }
  const mediaState = {
    ...video,
    url: video?.url,
    description: videoMeta?.description || rest.mediaState?.description,
    name: videoMeta?.name || 'Unnamed video',
    labelType: 'videoLabel',
    isPinned: videoMeta?.pinned,
    metaId: videoMeta?.id
  }
  console.log(video)
  const eventHandler = useMediaEventHandlerWrapper({
    objectId: videoId,
    type: 'video',
    labelType: 'videoLabel',
    mediaState
  })
  if (!video) return null
  console.log(videoMeta)
  return (
    <Media
      {...rest}
      on={async e => {
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
