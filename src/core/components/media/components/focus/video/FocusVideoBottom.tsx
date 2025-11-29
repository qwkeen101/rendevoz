import { Icon, IconWithPopover, Menu, WithBorder } from '@/components'
import { Icons } from '@/consts'
import classnames from 'classnames'
import PodcastPlaylist from '@/core/components/podcast/components/PodcastPlaylist'
import useRenderMediaControlBar from '@/core/components/media/useRenderMediaControlBar'
import useMediaState from '@/core/components/media/hooks/useMediaState'
import { MetaStore } from '@/api/stores'
import { useMediaInstance } from '@/core/components/media/hooks/useMediaInstance'
import { memo } from 'react'
import useFocusSettings from '../useFocusSettings'
import { useIsIn } from '@/hooks'

const BUTTON_SIZE = 24
const LEFT_BUTTON_SIZE = 18

const subtitleModes = {
  original: '主字幕',
  translated: '翻译字幕',
  both: '双语字幕',
  none: '无字幕'
}
const VideoModes = {
  theater: ['park-bottom-bar', '剧场模式'],
  cinema: ['park-movie', '影院模式'],
  reader: ['park-align-text-left-one', '阅读模式']
}

export default memo(({ BUTTON_CLASS }: { BUTTON_CLASS: string }) => {
  const [mediaState, setMediaState] = useMediaState()
  const instance = useMediaInstance()
  const [settings, setSettings] = useFocusSettings()
  const {
    renderTotalTime,
    renderCurrentTime,
    renderSpeed,
    renderVolume,
    renderController,
    renderNextButton,
    renderPlayButton,
    renderPrevButton
  } = useRenderMediaControlBar()
  const { state, metaId, focus } = mediaState
  const meta = MetaStore.useValue(metaId)
  const metaVisible = meta && !meta?.deleted && !meta?.temp
  const { ref, isIn } = useIsIn()
  const collapsed = settings.controlbarCollapsed === true
  return (
    <div
      ref={ref}
      style={{
        transition: 'transform 0.2s ease',
        transform: collapsed ? (isIn || mediaState.focus?.settingsVisible ? 'translateY(0)' : 'translateY(calc(100% - 6px))') : undefined
      }}
      className='w-full absolute bottom-0 left-0'
    >
      {renderController()}
      <div
        style={{
          background: 'rgba(0, 0, 0, 0.8)'
        }}
        className={'p-5 w-full select-none justify-between items-center flex'}
      >
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
            size: LEFT_BUTTON_SIZE,
            className: 'hover:scale-[1.1] transition-transform text-black bg-white rounded-full p-2 cursor-pointer'
          })}
          {renderNextButton({
            className: BUTTON_CLASS,
            size: BUTTON_SIZE
          })}
          {renderSpeed({
            className: BUTTON_CLASS,
            size: LEFT_BUTTON_SIZE
          })}
        </div>
        <div className={'flex-1 flex items-center gap-6 justify-end pr-3'}>
          <Icon
            onClick={() => {
              setMediaState(s => ({
                ...s,
                focus: {
                  ...s.focus,
                  sidebarVisible: s.focus?.sidebar === 'label' ? !s.focus.sidebarVisible : true,
                  sidebar: 'label',
                  settingsVisible: false
                }
              }))
            }}
            size={LEFT_BUTTON_SIZE}
            className={BUTTON_CLASS}
            name='park-bookmark'
          />
          <Icon
            onClick={() => {
              setMediaState(s => ({
                ...s,
                focus: {
                  ...s.focus,
                  sidebarVisible: s.focus?.sidebar === 'ai' ? !s.focus.sidebarVisible : true,
                  sidebar: 'ai',
                  settingsVisible: false
                }
              }))
            }}
            size={LEFT_BUTTON_SIZE}
            className={BUTTON_CLASS}
            name='custom-stars'
          />
          <IconWithPopover
            content={setV => (
              <WithBorder className={'py-1'}>
                <Menu.NavigationMenu
                  layout={[
                    ...Object.keys(subtitleModes).map(i => ({
                      text: subtitleModes[i],
                      type: 'item',
                      key: i,
                      onSelect: () => {
                        setV(false)
                        setSettings(s => ({ ...s, subtitleMode: i }))
                      }
                    }))
                  ]}
                />
              </WithBorder>
            )}
            renderOnParent
            size={LEFT_BUTTON_SIZE}
            className={BUTTON_CLASS}
            name={settings.subtitleMode === 'none' ? 'custom-CCDisabled' : 'custom-CC'}
          />
          <IconWithPopover
            content={setV => (
              <WithBorder className={'py-1'}>
                <Menu.NavigationMenu
                  layout={[
                    ...Object.entries(VideoModes).map(i => ({
                      text: i[1][1],
                      type: 'item',
                      key: i[0],
                      icon: i[1][0],
                      onSelect: () => {
                        setV(false)
                        setSettings(s => ({ ...s, layout: i[0] }))
                      }
                    }))
                  ]}
                />
              </WithBorder>
            )}
            renderOnParent
            size={LEFT_BUTTON_SIZE}
            className={BUTTON_CLASS}
            name={VideoModes[settings.layout][0]}
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
          <Icon
            onClick={() => {
              setMediaState(s => ({ ...s, focus: { ...s.focus, sidebarVisible: false, settingsVisible: !s.focus?.settingsVisible } }))
            }}
            className={BUTTON_CLASS}
            size={LEFT_BUTTON_SIZE}
            name={'park-setting'}
          />
        </div>
      </div>
    </div>
  )
})
