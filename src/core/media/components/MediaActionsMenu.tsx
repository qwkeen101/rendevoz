import { Button, WithBorder } from '@/components'
import { Rendevoz } from '@/core/rendevoz'
import { MetaStore, ObjectStore } from '@/api/stores'
import { normalizeSecondsToTime } from '@/core/media/utils'
import { saveImageLocally } from '@/utils'
import { useTranslation } from 'react-i18next'
import useMediaState from '@/core/media/hooks/useMediaState'
import { useMediaInstance } from '@/core/media/hooks/useMediaInstance'

const MediaActionsMenu = ({ onClose }: { onClose?: VoidFunction }) => {
  const { t } = useTranslation()
  const [mediaState] = useMediaState()
  const instance = useMediaInstance()
  const { currentTime } = mediaState
  return (
    <WithBorder onClick={e => Rendevoz.Events.DOM.hasButton(e) && onClose?.()} padding={8} style={{ borderRadius: 8 }}>
      {mediaState.mode !== 'audio' && (
        <>
          <Button.IconButton
            icon="park-down-picture"
            text={t('general.Download screenshot')}
            onClick={() => {
              instance.imageOps?.captureCurrentImage().then(res => {
                if (res) {
                  const a = document.createElement('a')
                  a.href = res
                  a.download = `${mediaState.name}_${normalizeSecondsToTime(currentTime)}.png`
                  a.click()
                }
              })
            }}
          />
          <Button.IconButton
            icon="park-screenshot"
            onClick={() => {
              instance.imageOps?.captureCurrentImage?.().then(data => {
                if (data) {
                  instance.on?.({
                    type: 'addScreenshot',
                    imageDataUrl: data
                  })
                }
              })
            }}
            text={t('general.add screenshot')}
          ></Button.IconButton>
        </>
      )}
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
            time: currentTime,
            name: 'Unnamed Label'
          })
        }}
        text={t('general.add label')}
      ></Button.IconButton>
      <Button.IconButton
        icon="park-time"
        text={t('general.Copy timestamp as link')}
        onClick={() => {
          instance.on?.({ type: 'copyTimestamp', currentTime: mediaState.currentTime })
        }}
      ></Button.IconButton>
    </WithBorder>
  )
}

export default MediaActionsMenu
