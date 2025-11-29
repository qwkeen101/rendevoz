import usePodcastData from '@/core/components/feed/components/podcast/usePodcastData'
import { AnimatePopover, Icon, Menu, Select, TabPane, Tabs, useElementScrollRestore, WithBorder } from '@/components'
import ItemRenderer from '@/core/components/feed/components/podcast/ItemRenderer'
import { memo, useRef, useState } from 'react'
import useNorepeatNavigate from '@/core/components/feed/components/podcast/useNorepeatNavigate'
import { useMeasure } from '@/hooks'
import { useLocation } from 'react-router-dom'
import PodcastSearchInput from '@/core/components/feed/components/podcast/components/PodcastSearchInput'
import usePodcastState from '@/core/components/feed/components/podcast/usePodcastState'
import toast from 'react-hot-toast'
import { ObjectStore } from '@/api/stores'
import { IEpisode, IPodcast } from '~/typings'
import fuzzysort from 'fuzzysort'
import { sortBy } from 'lodash'
import classnames from 'classnames'

export default memo(() => {
  const { followedEpisodes, followedPodcasts } = usePodcastData()
  const navigate = useNorepeatNavigate()
  const ref = useRef<HTMLDivElement>(null)
  const { width } = useMeasure(ref)
  const colMode = width > 0 && width < 600
  const [state, setState] = usePodcastState()
  const [isSearching, setIsSearching] = useState(false)
  const { librarySearch } = state
  useElementScrollRestore({
    elementKey: 'podcast-library',
    elementRef: ref
  })
  const handleSearch = async () => {
    if (isSearching) return
    setIsSearching(true)
    const allPodcasts = (await Promise.all(followedPodcasts.map(async i => ObjectStore('podcast').fetchOneById(i)))).filter(
      i => i
    ) as IPodcast[]
    const allEpisodes = (await Promise.all(followedEpisodes.map(async i => ObjectStore('episode').fetchOneById(i)))).filter(
      i => i
    ) as IEpisode[]
    let searchedPodcasts = librarySearch.query
      ? fuzzysort
          .go(librarySearch.query, allPodcasts, {
            keys: ['name', 'description', 'artist']
          })
          .map(i => i.obj)
      : allPodcasts
    let searchedEpisodes = librarySearch.query
      ? fuzzysort.go(librarySearch.query, allEpisodes, { keys: ['name', 'description'] }).map(i => i.obj)
      : allEpisodes
    const filter = librarySearch.filter ?? 'all'
    const sort = librarySearch.sort ?? 'update'
    console.log(filter)
    if (filter === 'starred') {
      searchedPodcasts = searchedPodcasts.filter(i => i.starred)
      searchedEpisodes = searchedEpisodes.filter(i => i.starred)
    }
    switch (sort) {
      case 'follow':
        searchedPodcasts = sortBy(searchedPodcasts, 'followedAt')
        searchedEpisodes = sortBy(searchedEpisodes, 'followedAt')
        break
      case 'update':
        searchedPodcasts = sortBy(searchedPodcasts, 'podcastUpdatedAt')
        searchedEpisodes = sortBy(searchedEpisodes, 'releaseDate')
        break
      case 'view':
        searchedPodcasts = sortBy(searchedPodcasts, 'viewedAt')
        searchedEpisodes = sortBy(searchedEpisodes, 'viewedAt')
        break
    }
    setTimeout(() => {
      setIsSearching(false)
      setState(s => ({
        ...s,
        librarySearch: {
          ...s.librarySearch,
          results: {
            podcasts: searchedPodcasts.map(i => i.id),
            episodes: searchedEpisodes.map(i => i.id)
          }
        }
      }))
    }, 600)
  }
  return (
    <div ref={ref} className={'h-full overflow-y-auto'}>
      <div className={'flex @container flex-col w-full pb-40'}>
        <PodcastSearchInput
          className={'p-6 pb-0'}
          onSubmit={() => handleSearch()}
          searchElement={
            <div
              onClick={() => handleSearch()}
              className={classnames(
                '!rounded-md border hover-bg-hover cursor-pointer',
                isSearching && '!cursor-not-allowed super-transparent-font'
              )}
            >
              <Icon spin={isSearching} name={'park-refresh'} className={'h-10 px-3'} />
            </div>
          }
          extra={
            <>
              <AnimatePopover
                positions={['bottom']}
                padding={6}
                content={setV => (
                  <WithBorder padding={'0.25rem 0'}>
                    <Menu.NavigationMenu
                      onSelect={i => {
                        setV(false)
                        if (i?.type === 'item') {
                          setState(s => ({
                            ...s,
                            librarySearch: { ...s.librarySearch, filter: i.key! }
                          }))
                        }
                      }}
                      defaultSelected={[librarySearch.filter ?? 'all']}
                      layout={[
                        {
                          type: 'item',
                          text: 'All',
                          key: 'all'
                        },
                        {
                          type: 'item',
                          text: 'Starred',
                          key: 'starred'
                        }
                      ]}
                    />
                  </WithBorder>
                )}
              >
                <div className={'!rounded-md border hover-bg-hover'}>
                  <div className={'h-10 flex gap-2 items-center !px-3 cursor-pointer'}>
                    <Icon className={'icon-16'} name={'park-filter'} />
                    <div>{librarySearch.filter ?? 'all'}</div>
                    <Icon name={'park-down'} className={'ml-1 icon-14 super-transparent-font'} />
                  </div>
                </div>
              </AnimatePopover>
              <AnimatePopover
                positions={['bottom']}
                padding={6}
                content={setV => (
                  <WithBorder padding={'0.25rem 0'}>
                    <Menu.NavigationMenu
                      defaultSelected={[librarySearch.sort ?? 'update']}
                      onSelect={i => {
                        if (i?.type === 'item') {
                          setState(s => ({
                            ...s,
                            librarySearch: { ...s.librarySearch, sort: i.key! }
                          }))
                        }
                        setV(false)
                      }}
                      layout={[
                        {
                          type: 'item',
                          text: 'Update',
                          key: 'update'
                        },
                        {
                          type: 'item',
                          text: 'Follow',
                          key: 'follow'
                        },
                        {
                          type: 'item',
                          text: 'View',
                          key: 'view'
                        }
                      ]}
                    />
                  </WithBorder>
                )}
              >
                <div className={'!rounded-md border hover-bg-hover'}>
                  <div className={'h-10 flex gap-2 items-center !px-3 cursor-pointer'}>
                    <Icon className={'icon-16'} name={'park-sort-two'} />
                    <div>{librarySearch.sort ?? 'update'}</div>
                    <Icon name={'park-down'} className={'ml-1 icon-14 super-transparent-font'} />
                  </div>
                </div>
              </AnimatePopover>
            </>
          }
          value={state.librarySearch?.query ?? ''}
          onChange={v =>
            setState(s => ({
              ...s,
              librarySearch: { ...s.librarySearch, query: v }
            }))
          }
        />
        <Tabs
          tabNavContainerStyle={{
            position: 'sticky',
            top: 0,
            zIndex: 20,
            background: 'var(--global-background)'
          }}
          tabNavClassname={'!px-3 !py-1.5'}
          tabNavContainerClassname={'pt-1.5 px-6'}
          onTabClick={k => setState(s => ({ ...s, librarySearch: { ...s.librarySearch, tab: k } }))}
          container={false}
          defaultActiveKey={librarySearch.tab ?? 'podcast'}
          tabNavMode={'underline'}
        >
          <TabPane className={'py-5 px-6 flex flex-col gap-4'} tab={'Podcasts'} key={'podcast'}>
            {(librarySearch.results?.podcasts ?? followedPodcasts).map(p => (
              <ItemRenderer
                columnMode={colMode}
                onClick={() => {
                  navigate(`/podcast/${p}`)
                }}
                id={p}
                key={p}
                type={'podcast'}
              />
            ))}
          </TabPane>
          <TabPane className={'py-5 px-6 flex flex-col gap-4'} tab={'Episodes'} key={'episode'}>
            {(librarySearch.results?.episodes ?? followedEpisodes).map(p => (
              <ItemRenderer
                columnMode={colMode}
                onClick={() => {
                  navigate(`/episode/${p}`)
                }}
                id={p}
                key={p}
                type={'episode'}
              />
            ))}
          </TabPane>
        </Tabs>
      </div>
    </div>
  )
})
