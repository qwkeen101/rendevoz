import { Menu, WithBorder } from '@/components'
import { useTranslation } from 'react-i18next'
import useMediaState from '@/core/components/media/hooks/useMediaState'
import { useMediaInstance } from '@/core/components/media/hooks/useMediaInstance'
import toast from 'react-hot-toast'
import { Icons } from '@/consts'
import trans from '@/consts/trans'
export default ({ onClose }: { onClose: VoidFunction }) => {
  const { t } = useTranslation()
  const [mediaState, setMediaState] = useMediaState()
  const instance = useMediaInstance()
  const { currentTime, name, url, layout, websiteUrl } = mediaState
  const targetUrl = websiteUrl || url
  return (
    <WithBorder className={'popover-menu'}>
      <Menu.NavigationMenu
        layout={[
          ...((typeof layout?.moreMenu === 'function' ? layout.moreMenu(onClose) : layout?.moreMenu) || []),
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
                      text: t('media.Save screenshot'),
                      onSelect: () => {
                        onClose?.()
                        instance.imageOps?.captureCurrentImage().then(res => {
                          if (res) {
                            const a = document.createElement('a')
                            a.href = res
                            a.download = `${mediaState.name}_${DateFormat.formatDuration(currentTime)}.png`
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
                      name: ''
                    })
                  }
                },
                {
                  type: 'item',
                  key: 'copy-timestamp',
                  text: t('media.Copy timestamp as link'),
                  onSelect: () => {
                    onClose?.()
                    instance.on({
                      type: 'getMeta',
                      onSuccess: id => {
                        const type = 'text/html'
                        const url = `rendevoz://object/${id}?t=${currentTime}`
                        const text = new Blob([url], { type: 'text/plain' })
                        const blob = new Blob([`<a href="${url}">${name} — ${DateFormat.formatDuration(currentTime)}</a>`], {
                          type
                        })
                        navigator.clipboard.write([new ClipboardItem({ 'text/html': blob, 'text/plain': text })])
                        toast.success(t('general.Copied'))
                      }
                    })
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
            key: 'import-subtitle',
            icon: 'custom-CC',
            text: t('media.Import subtitles'),
            onSelect: () => {
              onClose?.()
              setMediaState(s => ({ ...s, subtitleImporterVisible: true }))
            }
          },
          {
            type: 'item',
            key: 'view-original',
            icon: Icons.Efferent,
            text: t(trans.ViewOriginal),
            onSelect: () => {
              onClose?.()
              Global.utils.openSpecificURL(targetUrl)
            }
          },
          {
            type: 'item',
            key: 'copy-link',
            icon: Icons.Copy,
            text: t(trans.CopyLink),
            onSelect: () => {
              onClose?.()
              navigator.clipboard.writeText(Global.utils.formatURL(targetUrl))
              toast.success(t(trans.Copied))
            }
          }
        ]}
      />
    </WithBorder>
  )
}
