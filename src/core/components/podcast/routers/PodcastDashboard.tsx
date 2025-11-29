import { RefObject, useRef } from 'react'
import { AnimatePopover, Button, Content, Menu, useElementScrollRestore, WithBorder } from '@/components'
import PodcastItem from '@/core/components/podcast/PodcastItunesItem'
import { IItunesPodcast } from '@/core/components/podcast/services/podcasts'
import { chunk, fill } from 'lodash'
import usePodcastInstance from '@/core/components/podcast/hooks/usePodcastInstance'
import { useNorepeatNavigate } from '@/hooks'
import EpisodePlaylist from '@/core/components/podcast/EpisodePlaylist'
import usePodcastData from '@/core/components/podcast/hooks/usePodcastData'
import { useTranslation } from 'react-i18next'
import classnames from 'classnames'

import countryCodes from '@/core/components/podcast/CountryCodes.json'
import { Trans } from '@/consts'

const LanguageChanger = () => {
  const { t } = useTranslation()
  const co = usePodcastData().country ?? 'cn'
  return (
    <AnimatePopover
      content={setV => (
        <WithBorder className={'py-1 min-w-56 max-h-72 overflow-y-auto'}>
          <Menu.NavigationMenu
            onSelect={k => {
              setV(false)
              usePodcastData.updateData(c => ({ ...c, country: k.key }))
            }}
            defaultSelected={co ? [co] : undefined}
            layout={[
              {
                type: 'title',
                name: t(Trans.ChooseLanguage)
              },
              ...countryCodes.map(i => ({
                type: 'item',
                key: i.value,
                text: i.children
              }))
            ]}
          />
        </WithBorder>
      )}
      positions={['bottom']}
      padding={6}
      align='end'
    >
      <Button.IconButton
        className='border !rounded-3xl !pl-4 !pr-3'
        text={countryCodes.find(i => i.value === co)?.children}
        suffixIcon='park-down'
        name={'park-international'}
      />
    </AnimatePopover>
  )
}
export default () => {
  const navigate = useNorepeatNavigate()
  const dashboard = usePodcastData().dashboard
  const instance = usePodcastInstance()
  const podcastScrollerRef = useRef<HTMLDivElement>(null)
  const episodeScrollerRef = useRef<HTMLDivElement>(null)
  const scrollContainer = (
    items: IItunesPodcast[],
    max = 30,
    opts?: {
      ref?: RefObject<HTMLDivElement>
      onClick?: (i: IItunesPodcast) => void
      column?: boolean
      width?: string
      maxWidth?: string
      skeleton?: boolean
      rows?: number
      className?: string
    }
  ) => {
    const chunked = chunk(items.slice(0, max), opts?.rows ?? 1)
    return (
      <div
        ref={opts?.ref}
        className={classnames(
          'no-scrollbar flex min-w-full overflow-x-auto -mr-7 pr-7 snap-x shrink-0 snap-mandatory',
          opts?.className,
          opts?.column ? 'gap-4' : 'gap-6'
        )}
      >
        {chunked.map(i => (
          <Content flex column key={i[0].id} className={'flex-shrink-0 gap-4 w-fit snap-start'}>
            {i.map(o => (
              <PodcastItem
                skeleton={opts?.skeleton}
                onClick={() => opts?.onClick?.(o)}
                columnMode={opts?.column}
                style={{
                  width: opts?.width,
                  maxWidth: opts?.maxWidth
                }}
                item={o}
                key={o.id}
              />
            ))}
          </Content>
        ))}
      </div>
    )
  }

  useElementScrollRestore({
    elementRef: podcastScrollerRef,
    elementKey: 'podcast-dashboard-podcast',
    direction: 'horizontal'
  })
  useElementScrollRestore({
    elementRef: episodeScrollerRef,
    direction: 'horizontal',
    elementKey: 'podcast-dashboard-episode'
  })
  const { t } = useTranslation()
  return (
    <div className={'p-9 pb-40 flex-1 overflow-hidden flex flex-col'}>
      <div className='flex justify-between items-start'>
        <div className={'text-4xl font-bold'}>{t('podcast.Trending')}</div>
        <LanguageChanger />
      </div>

      <EpisodePlaylist />
      <div
        className={'w-fit hover:underline font-bold text-2xl mt-10 mb-5 cursor-pointer'}
        onClick={() => {
          navigate('/hot/podcastList')
        }}
      >
        {t('podcast.Hot podcasts')}
      </div>
      {scrollContainer(dashboard?.hot || fill(Array(10), {}), 20, {
        column: true,
        ref: podcastScrollerRef,
        rows: 1,
        skeleton: !dashboard?.hot,
        onClick: async i => {
          instance.actionOps?.load('podcast', i.url)
        }
      })}
      <div
        className={'w-fit hover:underline font-bold text-2xl mt-10 mb-5 cursor-pointer'}
        onClick={() => {
          navigate('/hot/episodeList')
        }}
      >
        {t('podcast.Hot episodes')}
      </div>
      {scrollContainer(dashboard?.episodes || fill(Array(12), {}), 30, {
        width: '80vw',
        maxWidth: '36rem',
        ref: episodeScrollerRef,
        skeleton: !dashboard?.episodes,
        rows: 4,
        onClick: i => {
          instance.actionOps?.load('episode', i.url)
        }
      })}
    </div>
  )
}
