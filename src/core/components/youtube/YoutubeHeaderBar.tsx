import useNorepeatNavigate from '@/core/components/podcast/useNorepeatNavigate'
import { useLocation, useMatch, useParams } from 'react-router-dom'
import useFeedState from '@/core/components/feed/hooks/useFeedState'
import { useNProgress } from '@tanem/react-nprogress'
import { memo, ReactElement, ReactNode, useLayoutEffect, useState } from 'react'
import { AnimatePopover, Icon, IconWithPopover, WithBorder } from '@/components'
import gnews from '@/assets/images/google-news.png?url'
import { MetaStore, ObjectStore } from '@/api/stores'
import { Icons } from '@/consts'
import { TabTitle } from '@/core/rendevoz/components'
import useFeedInstance from '@/core/components/feed/hooks/useFeedInstance'
import { useTranslation } from 'react-i18next'
import trans from '@/consts/trans'
import yt from '@/assets/images/youtube.png?url'
import YoutubeItemMenu from '@/core/components/feed/youtube/YoutubeItemMenu'
import useYoutubeVideoToMeta from '@/core/components/feed/youtube/useYoutubeVideoToMeta'
import classnames from 'classnames'
import MetaTagPicker from '@/core/object/MetaTagPicker'
import { GlobalInstance } from '@/hooks'
import { ObjectTag } from '@/core'
const Bar: React.FC<{ animationDuration: number; progress: number }> = ({ animationDuration, progress }) => (
  <div
    className={''}
    style={{
      height: 3,
      left: 0,
      marginLeft: `${(-1 + progress) * 100}%`,
      position: 'absolute',
      background: 'var(--select-color)',
      top: 0,
      transition: `margin-left ${animationDuration}ms linear`,
      width: '100%',
      zIndex: 1031
    }}
  ></div>
)
const Container: React.FC<{
  animationDuration: number
  isFinished: boolean
  children: ReactNode
}> = ({ animationDuration, children, isFinished }) => (
  <div
    style={{
      opacity: isFinished ? 0 : 1,
      pointerEvents: 'none',
      transition: `opacity ${animationDuration}ms linear`,
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%'
    }}
  >
    {children}
  </div>
)

const Progress = ({ isAnimating }: { isAnimating: boolean }) => {
  const { animationDuration, isFinished, progress } = useNProgress({
    isAnimating
  })
  return (
    <Container animationDuration={animationDuration} isFinished={isFinished}>
      <Bar animationDuration={animationDuration} progress={progress} />
    </Container>
  )
}
export default memo(() => {
  const [feedState] = useFeedState()
  const [k, setK] = useState(0)
  const instance = useFeedInstance()
  const matchDashboard = useMatch('/dashboard/youtube')
  const matchVideo = useMatch('/youtube/video/:id')
  useLayoutEffect(() => {
    if (feedState.isFetching) {
      setK(s => s + 1)
    }
  }, [feedState.isFetching])
  const navigate = useNorepeatNavigate()
  return (
    <div className={'w-full bg-global h-12 px-6 flex items-center relative'}>
      <Progress isAnimating={!!feedState.isFetching} key={k} />
      <Title />
      <div className={'flex items-center ml-auto gap-2 shrink-0 icon-16'}>
        {matchVideo && <TagIcon />}
        {matchVideo && <VideoMetaIcon />}
        {matchDashboard && (
          <img
            onClick={() => {
              instance.changeMode?.('feed')
            }}
            className={'square-button w-8 h-8'}
            src={gnews}
          />
        )}
        {!matchVideo && (
          <>
            <Icon
              onClick={() => {
                navigate('/dashboard/youtube')
              }}
              name={Icons.Fire}
              className={'square-button'}
            />
            <Icon
              onClick={() => {
                navigate('/youtube/library')
              }}
              name={Icons.DocumentLibrary}
              className={'square-button'}
            />
            <Icon
              onClick={() => {
                navigate('/youtube/history')
              }}
              name={Icons.History}
              className={'square-button'}
            />
          </>
        )}
      </div>
    </div>
  )
})

const DefaultIcon = <img src={yt} className={'w-5 h-5 object-cover rounded'} />
const Title = () => {
  const { id } = useParams()
  const navigate = useNorepeatNavigate()
  const location = useLocation()
  let name: string | ReactElement = ''
  const path = location.pathname
  const { t } = useTranslation()
  if (path === '/dashboard/youtube') {
    name = t(trans.Trending)
  }
  if (path === '/youtube/library') {
    name = t(trans.Feed.Library)
  }
  if (path === '/youtube/history') {
    name = t(trans.History)
  }
  if (path === '/youtube/search') {
    name = t(trans.Search)
  }
  let itemType: 'youtubeVideo' | 'youtubeChannel' | 'youtubePlaylist' | 'youtubeFolder' | undefined = undefined
  switch (true) {
    case path.startsWith('/youtube/video/'):
      itemType = 'youtubeVideo'
      break
    case path.startsWith('/youtube/channel/'):
      itemType = 'youtubeChannel'
      break
    case path.startsWith('/youtube/playlist'):
      itemType = 'youtubePlaylist'
      break
    case path.startsWith('/youtube/folder'):
      itemType = 'youtubeFolder'
  }
  return (
    <div className={'gap-2 flex items-center'}>
      {location.key !== 'default' && (
        <Icon
          strokeWidth={4}
          size={16}
          name={'park-left'}
          onClick={() => {
            navigate(-1)
          }}
          className={'square-button -ml-3.5'}
        />
      )}
      {name && (
        <div
          className={'text-base sm:text-lg line-clamp-1 break-all'}
          style={{
            maxWidth: 'max(800px, 80%)'
          }}
        >
          {name}
        </div>
      )}
      {typeof name === 'string' && <TabTitle title={name} icon={DefaultIcon} />}
      {itemType && id && <ItemTitle type={itemType} id={Number(id)} />}
    </div>
  )
}
const ItemTitle = ({ id, type }: { id: number; type: 'youtubeVideo' | 'youtubeChannel' | 'youtubePlaylist' | 'youtubeFolder' }) => {
  const item = ObjectStore(type).useValue(id)
  if (!item) return null
  return (
    <>
      <TabTitle icon={<img src={item.thumbnail ?? yt} className={'object-cover w-6 h-6 rounded'} />} title={item.name ?? 'Unnamed'} />
      {item.name && (
        <div
          className={'text-base sm:text-lg line-clamp-1 break-all'}
          style={{
            maxWidth: 'max(800px, 80%)'
          }}
        >
          {item.name}
        </div>
      )}
    </>
  )
}

const VideoMetaIcon = () => {
  const { id } = useParams()
  const video = ObjectStore('youtubeVideo').useValue(Number(id))
  const meta = useYoutubeVideoToMeta(Number(id))
  const instance = useFeedInstance()
  const { t } = useTranslation()
  if (video) {
    return (
      <>
        {meta ? (
          <>
            <Icon
              name={Icons.Info}
              onClick={() => {
                GlobalInstance.metaOps?.openDetails(meta.id)
              }}
              tooltip={t(trans.Meta.ViewDetails)}
              size={16}
              className={'square-button'}
            />
            <Icon
              name={Icons.MoveTo}
              onClick={() => {
                GlobalInstance.metaOps?.quickAdd(meta.id)
              }}
              tooltip={t(trans.Meta.MoveTo)}
              size={16}
              className={'square-button'}
            />
          </>
        ) : (
          <>
            <Icon
              name={Icons.AddAsObject}
              onClick={() => {
                instance.youtubeOps?.addVideoAsMeta(video.id)
              }}
              tooltip={t(trans.Meta.AddAsObject)}
              size={16}
              className={'square-button'}
            />
            <Icon
              name={Icons.MoveTo}
              onClick={() => {
                instance.youtubeOps?.addVideoAsMeta(video.id).then(meta => {
                  if (meta) {
                    GlobalInstance.metaOps?.quickAdd(meta.id)
                  }
                })
              }}
              tooltip={t(trans.Meta.MoveTo)}
              size={16}
              className={'square-button'}
            />
          </>
        )}
        <IconWithPopover
          placement={['bottom']}
          name={Icons.More}
          strokeWidth={4}
          className={classnames('square-button-small')}
          size={20}
          content={setV => <YoutubeItemMenu showMeta={false} id={video.id} onClose={() => setV(false)} type={'video'} />}
        />
      </>
    )
  }
}

const TagIcon = () => {
  const { id } = useParams()
  const feedId = Number(id)
  const m = useYoutubeVideoToMeta(!Number.isNaN(feedId) ? feedId : undefined)
  const tags = ObjectStore('tag').useMultiple(m?.tags)
  const tagLength = tags.length ?? 0
  const instance = useFeedInstance()
  return (
    <AnimatePopover
      padding={6}
      positions={['bottom']}
      withClickCover
      content={setV => (
        <WithBorder>
          <MetaTagPicker
            style={{
              width: 240
            }}
            alreadyTags={m?.tags ?? []}
            onChange={async v => {
              if (m) {
                MetaStore.updateMetaObject({ id: m.id, tags: v })
              } else {
                const meta = await instance.youtubeOps?.addVideoAsMeta(feedId)
                if (meta) {
                  MetaStore.updateMetaObject({ id: meta.id, tags: v })
                }
              }
            }}
          />
        </WithBorder>
      )}
    >
      <div
        className={classnames(
          'flex items-center gap-2 cursor-pointer',
          tagLength > 0 ? 'rounded-full pr-3.5 py-1.5 pl-3 border hover-bg-hover' : 'square-button'
        )}
      >
        <Icon name={Icons.Tag} size={tagLength > 0 ? 14 : 16}></Icon>
        {tagLength > 0 ? (
          <div className={'font-size-12 items-end flex gap-2'}>
            {tags.slice(0, 3).map(i => (
              <ObjectTag tag={i.id} key={i.id} hideDelete small square />
            ))}
            {tags.length > 3 ? <span className={'font-semibold leading-tight transparent-font'}>...</span> : null}
          </div>
        ) : null}
      </div>
    </AnimatePopover>
  )
}
