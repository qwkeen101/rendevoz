import { Icon, IconWithPopover } from '@/components'
import { Icons } from '@/consts'
import classnames from 'classnames'
import PodcastPlaylist from '@/core/components/podcast/components/PodcastPlaylist'
import useRenderMediaControlBar from '@/core/components/media/useRenderMediaControlBar'
import useMediaState from '@/core/components/media/hooks/useMediaState'
import { MetaStore } from '@/api/stores'
import { useMediaInstance } from '@/core/components/media/hooks/useMediaInstance'
import { memo } from 'react'
const BUTTON_SIZE = 24
const LEFT_BUTTON_SIZE = 20
export default memo(({ BUTTON_CLASS }: { BUTTON_CLASS: string }) => {
  const [mediaState, setMediaState] = useMediaState()
  const instance = useMediaInstance()
  const { renderTotalTime, renderCurrentTime, renderVolume, renderController, renderNextButton, renderPlayButton, renderPrevButton } =
    useRenderMediaControlBar()
  const { state, metaId } = mediaState
  const meta = MetaStore.useValue(metaId)
  const metaVisible = meta && !meta?.deleted && !meta?.temp
  return (
    <div className={'p-5 w-full select-none relative justify-between items-center flex'}>
      <div className={'absolute top-0 -translate-y-full left-0 w-full'}>{renderController()}</div>
      <div className={'flex-1 flex gap-6 pl-3'}>
        <Icon
          onClick={state?.follow?.onFollow}
          name={Icons.Like}
          className={classnames(BUTTON_CLASS, state?.follow?.followed ? '!text-red-500 !opacity-100' : '')}
          size={LEFT_BUTTON_SIZE}
          theme={state?.follow?.followed ? 'filled' : undefined}
        />
        <Icon
          onClick={state?.follow?.onFollow}
          name={metaVisible ? Icons.Info : Icons.AddAsObject}
          className={classnames(BUTTON_CLASS, metaVisible ? 'select-color-font !opacity-100' : '')}
          size={LEFT_BUTTON_SIZE}
          strokeWidth={4}
          theme={metaVisible ? 'filled' : undefined}
        />
        {renderVolume({
          iconClassname: BUTTON_CLASS,
          iconSize: LEFT_BUTTON_SIZE
        })}
        <div
          style={{
            letterSpacing: '-0.4px'
          }}
          className={'flex gap-1.5 items-center font-bold font-size-12 opacity-60'}
        >
          {renderCurrentTime({ className: '' })}
          <div>/</div>
          {renderTotalTime({ className: '' })}
        </div>
      </div>
      <div className={'flex items-center justify-center flex-1 gap-6'}>
        <Icon
          onClick={() => {
            instance.insertLabel?.({
              time: mediaState.currentTime
            })
          }}
          className={BUTTON_CLASS}
          size={LEFT_BUTTON_SIZE}
          name={Icons.Edit}
          theme={'filled'}
        />
        {renderPrevButton({
          className: BUTTON_CLASS,
          size: BUTTON_SIZE
        })}
        {renderPlayButton({
          spin: false,
          size: BUTTON_SIZE,
          className: 'bg-opacity-10 opacity-60 hover:opacity-80 bg-white rounded-full p-2 cursor-pointer'
        })}
        {renderNextButton({
          className: BUTTON_CLASS,
          size: BUTTON_SIZE
        })}
        <Icon
          onClick={() => {
            instance.insertLabel?.({
              time: mediaState.currentTime
            })
          }}
          className={BUTTON_CLASS}
          size={LEFT_BUTTON_SIZE}
          name={'park-time'}
        />
      </div>
      <div className={'flex-1 flex items-center gap-6 justify-end pr-3'}>
        <Icon
          size={LEFT_BUTTON_SIZE}
          className={BUTTON_CLASS}
          name={'custom-CC'}
          onClick={() => {
            setMediaState(s => ({ ...s, focus: { ...s.focus, subtitle: !s.focus?.subtitle } }))
          }}
        />
        {state?.episodePlaylist && (
          <IconWithPopover
            padding={12}
            className={BUTTON_CLASS}
            size={LEFT_BUTTON_SIZE}
            name={'park-music-list'}
            content={<PodcastPlaylist isPlaying={state.episodePlaylist.current} items={state.episodePlaylist.items} />}
          />
        )}
      </div>
    </div>
  )
})
