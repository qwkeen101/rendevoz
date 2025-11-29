import { useSelectMediaState } from '@/core/components/media/hooks/useMediaState'
import MediaAI from '@/core/components/media/components/AI/MediaAI'
import MediaLabelController from '@/core/components/media/components/sidebar/MediaLabelController'
import YoutubePlaylistView from '@/core/components/media/components/YoutubePlaylistView'
import { WithBorder } from '@/components'

export default () => {
  const sidebar = useSelectMediaState(s => s.focus?.sidebar) ?? 'ai'
  const visible = useSelectMediaState(s => s.focus?.sidebarVisible)
  return (
    <WithBorder
      style={{
        transform: visible ? 'translateX(0px)' : 'translateX(calc(100% + 12px))',
        position: 'absolute',
        transition: 'transform 0.2s ease',
        right: 12,
        bottom: 90,
        height: 600,
        zIndex: 999,
        width: 320
      }}
    >
      {sidebar === 'ai' && <MediaAI />}
      {sidebar === 'label' && <MediaLabelController />}
      {sidebar === 'playlist' && <YoutubePlaylistView />}
    </WithBorder>
  )
}
