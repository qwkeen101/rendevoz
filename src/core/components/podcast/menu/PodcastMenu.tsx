import { Menu, WithBorder } from '../../../../../components'
import { ObjectStore } from '../../../../../api/stores'
import useNorepeatNavigate from '../useNorepeatNavigate'
import usePodcastData from '@/core/components/feed/components/podcast/usePodcastData'
import usePodcastInstance from '@/core/components/feed/components/podcast/usePodcastInstance'
import { useTranslation } from 'react-i18next'
import { useMemo } from 'react'
import useEpisodeIsMeta from '@/core/components/feed/components/podcast/hooks/useEpisodeIsMeta'
import { GlobalInstance } from '@/hooks'
import addEpisodeAsMeta from '@/core/components/feed/components/podcast/services/addEpisodeAsMeta'

export default ({ id, type, onClose }: { id: number; type: 'podcast' | 'episode'; onClose?: VoidFunction }) => {
  const podcast = ObjectStore(type).useValue(id)
  const navigate = useNorepeatNavigate()
  const p = usePodcastData().playlist
  const playlist = useMemo(() => p, [])
  const inPlaylist = playlist.list.includes(id)
  const instance = usePodcastInstance()
  const isMeta = type === 'episode' && useEpisodeIsMeta(id)
  const { t } = useTranslation()
  return (
    <WithBorder onClick={e => e.stopPropagation()} padding={'0.4rem 0'}>
      <Menu.NavigationMenu
        className={'!min-w-60'}
        layout={[
          type === 'episode'
            ? isMeta
              ? {
                  icon: 'park-info',
                  text: t('general.View details'),
                  key: 'view-info',
                  type: 'item',
                  onSelect: () => {
                    onClose?.()
                    GlobalInstance.metaOps?.openDetails(isMeta.id)
                  }
                }
              : {
                  icon: 'park-share-one',
                  text: t('general.add as object'),
                  key: 'add-as-meta',
                  type: 'item',
                  onSelect: () => {
                    addEpisodeAsMeta(id)
                    onClose?.()
                  }
                }
            : undefined,
          type === 'episode'
            ? {
                icon: 'park-play',
                text: t('general.Play'),
                key: 'play',
                type: 'item',
                onSelect: () => {
                  onClose?.()
                  instance.actionOps?.playEpisode?.(id)
                }
              }
            : undefined,
          {
            icon: 'park-efferent-three',
            text: 'Open',
            key: 'open',
            type: 'item',
            onSelect: () => {
              navigate(`/${type}/${id}`)
              onClose?.()
            }
          },
          type === 'episode'
            ? {
                icon: 'park-music-list',
                key: 'playlist',
                type: 'item',
                text: inPlaylist ? 'Remove from playlist' : 'Add to playlist',
                onSelect: () => {
                  instance.actionOps?.queueEpisode?.(id)
                  onClose?.()
                }
              }
            : undefined,
          {
            icon: podcast?.followed ? 'park-link-one' : 'park-unlink',
            text: podcast?.followed ? t('general.Unfollow') : t('general.Follow'),
            key: 'follow',
            type: 'item',
            onSelect: () => {
              onClose?.()
              instance.dataOps?.follow?.(id, type)
            }
          },
          {
            icon: 'park-star',
            text: podcast?.starred ? t('general.Unstar') : t('general.Star'),
            key: 'star',
            type: 'item',
            onSelect: () => {
              onClose?.()
              instance.dataOps?.star?.(id, type)
            }
          },
          type === 'episode'
            ? {
                type: 'item',
                key: 'move-to',
                text: t('general.Move to'),
                icon: 'park-corner-up-right',
                onSelect: async () => {
                  onClose?.()
                  const meta = isMeta ?? (await addEpisodeAsMeta(id))
                  if (meta) {
                    GlobalInstance.metaOps?.quickAdd(meta.id)
                  }
                }
              }
            : undefined
        ]}
      />
    </WithBorder>
  )
}
