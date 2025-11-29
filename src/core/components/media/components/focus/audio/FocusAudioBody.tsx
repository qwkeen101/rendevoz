import classnames from 'classnames'
import { Markdown } from '@/components'
import useMediaState from '@/core/components/media/hooks/useMediaState'
import { memo, useRef } from 'react'
import FocusSubtitle from '@/core/components/media/components/focus/subtitle/FocusSubtitle'
const BG_CLASS = 'bg-white bg-opacity-5'
const SHADOW = '0 14px 14px -20px rgba(0,0,0,.3),0 4px 20px 0 rgba(0,0,0,.1)'
export default memo(() => {
  const [mediaState, setMediaState] = useMediaState()
  const { name, thumbnail, state, layout, description, focus } = mediaState
  const scroller = useRef<HTMLDivElement>(null)
  const renderMain = () => {
    return (
      <div className={'flex shrink-0 flex-col w-full h-full overflow-hidden'}>
        <div className={'font-medium text-2xl'}>{name}</div>
        {state?.podcast || state?.releaseTime ? (
          <div className={'flex transparent-font font-medium gap-6 mt-3'}>
            {state.podcast && (
              <div onClick={state.podcast.onNavigate}>
                播客: <span className={'hover:text-white transition-colors cursor-pointer ml-1'}>{state.podcast.name}</span>
              </div>
            )}
            {state.releaseTime ? (
              <div>
                发布时间: <span className={'ml-1'}>{DateFormat.formatTime(state.releaseTime)}</span>
              </div>
            ) : null}
          </div>
        ) : null}
        <div ref={scroller} className={'overflow-y-auto no-scrollbar flex flex-col gap-4 flex-1 mt-5'}>
          {description && (
            <div
              className={classnames('p-5 rounded-xl', BG_CLASS)}
              style={{
                boxShadow: SHADOW
              }}
            >
              <div className={'text-2xl font-bold mb-3'}>简介</div>
              <Markdown className={'font-size-16 whitespace-pre-wrap'} children={description} />
            </div>
          )}
          {state?.moreEpisodes?.length ? (
            <div className={classnames('p-5 rounded-xl', BG_CLASS)}>
              <div className={'text-2xl font-bold mb-5'}>更多单集</div>
              <div className={'grid grid-cols-3 gap-5'}>
                {state.moreEpisodes.map(i => (
                  <div
                    key={i.id}
                    className={'cursor-pointer'}
                    onClick={() => {
                      i.onNavigate?.()
                      scroller.current?.scrollTo(0, 0)
                    }}
                  >
                    <img src={i.thumbnail} className={'w-full aspect-square object-cover rounded-xl'} />
                    <div className={'line-clamp-2 font-size-13 mt-3'}>{i.name}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    )
  }
  return (
    <div className={'flex w-full flex-1 overflow-hidden p-32 pb-8 justify-center'}>
      <div
        style={{
          maxWidth: '88rem',
          minWidth: '50rem'
        }}
        className={'gap-16 flex items-start'}
      >
        {thumbnail && (
          <img
            style={{
              maxWidth: '30rem',
              boxShadow: SHADOW
            }}
            className={'w-full min-w-80 object-cover overflow-hidden aspect-square rounded-xl'}
            src={thumbnail}
          />
        )}
        <div className={'shrink-0 h-full relative overflow-hidden flex'}>
          <div
            style={{
              width: '36rem',
              transform: focus?.subtitle ? 'translateX(-36rem)' : '',
              transition: 'all 0.2s ease'
            }}
            className={'h-full flex'}
          >
            {renderMain()}
            <FocusSubtitle />
          </div>
        </div>
      </div>
    </div>
  )
})
