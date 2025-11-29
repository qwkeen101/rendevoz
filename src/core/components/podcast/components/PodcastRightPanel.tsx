import { Resizable } from 're-resizable'
import usePodcastState from '../hooks/usePodcastState'
import { memo, RefObject, useMemo } from 'react'
import { Icon, TabPane, Tabs, WithBorder } from '@/components'
import usePodcastData from '../hooks/usePodcastData'
import { ObjectStore } from '@/api/stores'
import ContextMenu from '@/components/contextMenu'
import PodcastMenu from '../menu/PodcastMenu'
import usePodcastInstance from '../hooks/usePodcastInstance'
import { IEpisode } from '../types'
import FocusReaderSubtitle from '../../media/components/focus/subtitle/FocusReaderSubtitle'
import { createPortal } from 'react-dom'
import MediaLabelController from '../../media/components/sidebar/MediaLabelController'

export default memo(({ parentRef }: { parentRef: RefObject<HTMLDivElement> }) => {
  const [state, setState] = usePodcastState()
  const visible = state.rightbarVisible ?? false
  const active = state.rightbarActive ?? 'playlist'
  const data = usePodcastData()
  const playlist = data.playlist
  const allEpisodes = ObjectStore('episode').useMultiple(playlist.list)
  const instance = usePodcastInstance()
  const history = data.history
  ObjectStore('podcast').useMultiple(useMemo(() => new Set(allEpisodes.map(i => i.podcastId ?? 0)), [allEpisodes]))
  const historyEpisodes = ObjectStore('episode').useMultiple(useMemo(() => history?.slice(0, 20)?.map(i => i.id), [history]))
  const idToHistory = useMemo(() => new Map(history?.map(i => [i.id, i.date])), [history])
  const renderEpisode = (i: IEpisode, renderDate?: boolean) => {
    return (
      <ContextMenu key={i.id} content={setV => <PodcastMenu onClose={() => setV(false)} type='episode' id={i.id} />}>
        <div
          onDoubleClick={() => {
            instance.actionOps?.playEpisode(i.id)
          }}
          className='flex gap-3 select-none light-hover items-center p-3 rounded-lg cursor-default'
        >
          <img src={i.thumbnail} className='size-11 rounded-md' />
          <div>
            <div className='line-clamp-1 font-size-13'>{i.name}</div>
            {i.podcastId ? (
              <div className='font-size-12 items-center flex w-fit mt-0.5 transparent-font'>
                <div
                  className='cursor-pointer line-clamp-1 hover-primary-color transition-colors'
                  onClick={() => {
                    instance.actionOps?.openPodcast(i.podcastId!)
                  }}
                >
                  {ObjectStore('podcast').getCachedOneById(i.podcastId)?.name}
                </div>
                {renderDate && idToHistory.has(i.id) ? (
                  <>
                    <div style={{ marginBottom: 2 }} className='mx-1 leading-none'>
                      •
                    </div>
                    <div>{DateFormat.formatTime(idToHistory.get(i.id)!)}</div>
                  </>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </ContextMenu>
    )
  }

  const renderInner = () => {
    if (active === 'playlist') {
      return (
        <Tabs
          extra={
            <Icon
              onClick={() => {
                setState(s => ({ ...s, rightbarVisible: false }))
              }}
              name='park-close'
              className='hover-active-button'
              strokeWidth={5}
              size={16}
            />
          }
          tabNavClassname='font-size-14 font-medium !pl-0 !pr-0 !mr-6'
          tabNavContainerClassname='px-5 py-4'
        >
          <TabPane key={'playlist'} tab='播放列表' className='px-2 pb-20 overflow-y-auto'>
            {allEpisodes.map(i => renderEpisode(i))}
          </TabPane>
          <TabPane key={'history'} tab='最近播放' className='px-2 pb-20 overflow-y-auto'>
            {historyEpisodes.map(i => renderEpisode(i, true))}
          </TabPane>
        </Tabs>
      )
    }
    if (active === 'subtitle') {
      return <FocusReaderSubtitle />
    }
    if (active === 'label') {
      return <MediaLabelController />
    }
  }

  const parent = parentRef.current
  if (!parent) return null
  return createPortal(
    <Resizable
      enable={{ left: true }}
      style={{
        transform: visible ? 'translateX(0)' : 'translateX(calc(100% + 0.75rem))',
        position: visible ? 'relative' : 'absolute',
        right: 0,
        top: 0
      }}
      className='pt-0 p-3 pl-0'
      defaultSize={{
        width: 360,
        height: '100%'
      }}
    >
      <div
        className='w-full h-full rounded-lg'
        style={{
          background: 'var(--background-base)'
        }}
      >
        {renderInner()}
      </div>
    </Resizable>,
    parent
  )
})
