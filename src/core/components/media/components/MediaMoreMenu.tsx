// @ts-nocheck
import { Menu, WithBorder } from '@/components'
import { useTranslation } from 'react-i18next'
import useMediaState from '@/core/components/media/hooks/useMediaState'
import { normalizeSecondsToTime } from '@/core/components/media/utils'
import { useMediaInstance } from '@/core/components/media/hooks/useMediaInstance'
import toast from 'react-hot-toast'

export default ({ onClose, onImportSubtitle }: { onClose: VoidFunction; onImportSubtitle?: VoidFunction }) => {
  const { t } = useTranslation()
  const [mediaState, setMediaState] = useMediaState()
  const instance = useMediaInstance()
  const { currentTime, mode, floated } = mediaState
  return (
    <WithBorder padding={'0.2rem 0 0.4rem'} width={200}>
      <Menu.NavigationMenu
        layout={[
          ...(currentTime !== undefined
            ? [
                {
                  type: 'title',
                  name: t('general.Tools')
                },
                mediaState.mode !== 'audio'
                  ? {
                      type: 'item',
                      key: 'download-screenshot',
                      icon: 'park-down-picture',
                      text: t('general.Save screenshot'),
                      onSelect: () => {
                        onClose?.()
                        instance.imageOps?.captureCurrentImage().then(res => {
                          if (res) {
                            const a = document.createElement('a')
                            a.href = res
                            a.download = `${mediaState.name}_${normalizeSecondsToTime(currentTime)}.png`
                            a.click()
                          }
                        })
                      }
                    }
                  : undefined,
                {
                  type: 'item',
                  text: t('general.Add chapter'),
                  key: 'add-chapter',
                  icon: 'park-link',
                  onSelect: () => {
                    onClose?.()
                    instance.insertChapter?.({
                      startTime: currentTime,
                      name: 'Untitled Chapter'
                    })
                  }
                },
                {
                  type: 'item',
                  key: 'copy-timestamp',
                  text: t('general.Copy timestamp as link'),
                  onSelect: () => {
                    onClose?.()
                    toast.success(t('general.Copied'))
                    instance.on?.({ type: 'copyTimestamp', currentTime })
                  },
                  icon: 'park-time'
                }
              ]
            : []),
          {
            type: 'title',
            name: t('general.More')
          },
          {
            type: 'item',
            key: 'stretch',
            text: t('general.Picture-in-Picture'),
            onSelect: () => {
              onClose?.()
              setMediaState(s => ({ ...s, floated: !s.floated }))
            },
            icon: 'park-stretching'
          },
          mode === 'audio' || mode === 'video'
            ? {
                type: 'item',
                key: 'transcribe',
                icon: 'park-voice',
                text: t('general.Transcribe audio'),
                onSelect: () => {
                  onClose?.()
                  instance.transcribe?.()
                }
              }
            : undefined,
          onImportSubtitle
            ? {
                type: 'item',
                key: 'import-subtitle',
                icon: 'custom-CC',
                text: t('general.import subtitles'),
                onSelect: () => {
                  onClose?.()
                  onImportSubtitle?.()
                }
              }
            : undefined,
          {
            type: 'item',
            key: 'move-to',
            text: t('general.Move to'),
            icon: 'park-corner-up-right',
            onSelect: () => {
              onClose?.()
              instance.on?.({ type: 'assignToNewCollection' })
            }
          }
        ]}
      />
    </WithBorder>
  )
}
