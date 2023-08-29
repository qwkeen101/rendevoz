import { Button, WithBorder } from '@/components'
import { Rendevoz } from '@/core/rendevoz'
import { MetaStore, ObjectStore } from '@/stores'
import { normalizeSecondsToTime } from '@/core/video/utils'
import { saveImageLocally } from '@/utils'
import { useTranslation } from 'react-i18next'
import useVideoState from '@/core/video/hooks/useVideoState'
import { useVideoInstance } from '@/core/video/hooks/useVideoInstance'

const VideoActionsMenu = ({ onClose }: { onClose?: VoidFunction }) => {
  const { t } = useTranslation()
  const [videoState, setVideoState] = useVideoState()
  const instance = useVideoInstance()
  const { currentTime } = videoState
  const videoMeta = videoState.videoId ? MetaStore.getMetaObjectByObjectId(videoState.videoId) : undefined
  return (
    <WithBorder onClick={e => Rendevoz.Events.DOM.hasButton(e) && onClose?.()} padding={8} style={{ borderRadius: 8 }}>
      <Button.IconButton
        icon="park-down-picture"
        text={t('general.Download screenshot')}
        onClick={() => {
          const videoMeta = videoState.videoId ? MetaStore.getMetaObjectByObjectId(videoState.videoId) : undefined
          if (!videoMeta) return
          instance.captureCurrentImage?.().then(res => {
            if (res) {
              const a = document.createElement('a')
              a.href = res
              a.download = `${videoMeta.name}_${normalizeSecondsToTime(currentTime)}.png`
              a.click()
            }
          })
        }}
      />
      <Button.IconButton
        icon="park-screenshot"
        onClick={() => {
          instance.captureCurrentImage?.().then(data => {
            if (data) {
              const videoMeta = videoState.videoId ? MetaStore.getMetaObjectByObjectId(videoState.videoId) : undefined
              saveImageLocally(data, { compress: false }).then(res => {
                ObjectStore('image').addOneWithMeta(
                  {
                    imageUrl: res
                  },
                  {
                    showMetaModal: false,
                    currentMeta: {
                      name: 'Video screenshot',
                      coverImgSrc: res,
                      fromObject: videoMeta
                        ? {
                            metaId: videoMeta.id,
                            type: 'video',
                            time: currentTime
                          }
                        : undefined
                    }
                  }
                )
              })
            }
          })
        }}
        text={t('general.add screenshot')}
      ></Button.IconButton>
      <Button.IconButton
        onClick={() => {
          instance.insertChapter?.({
            startTime: currentTime,
            name: 'Untitled Chapter'
          })
        }}
        text={t('general.add chapter')}
        icon="park-link"
      ></Button.IconButton>
      <Button.IconButton
        icon="park-pin"
        onClick={() => {
          instance.insertLabel?.({
            videoTime: currentTime,
            name: 'Unnamed Label'
          })
        }}
        text={t('general.add label')}
      ></Button.IconButton>
      <Button.IconButton
        icon="park-time"
        text={t('general.Copy timestamp as link')}
        onClick={() => {
          if (videoMeta?.id) {
            const curr = videoState.currentTime
            const type = 'text/html'
            const url = `rendevoz://object/${videoMeta.id}?t=${curr}`
            const text = new Blob([url], { type: 'text/plain' })
            const blob = new Blob([`<a href="${url}">${videoMeta.name} — ${normalizeSecondsToTime(curr)}</a>`], { type })
            navigator.clipboard.write([new ClipboardItem({ 'text/html': blob, 'text/plain': text })])
          }
        }}
      ></Button.IconButton>
    </WithBorder>
  )
}

export default VideoActionsMenu
