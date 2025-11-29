import { atom } from 'jotai'
import { IItunesPodcast } from '@/core/components/feed/utils/service/podcasts'
import { useGlobalAtom } from '@/hooks'
import { Content, Icon, Tabs, TabPane, useElementScrollRestore } from '@/components'
import { memo, useRef } from 'react'
import PodcastItem from '@/core/components/feed/components/podcast/PodcastItunesItem'
import isHotkey from 'is-hotkey'
import { KEY } from '@/consts'
import usePodcastInstance from '@/core/components/feed/components/podcast/usePodcastInstance'
import usePodcastState from '@/core/components/feed/components/podcast/usePodcastState'
import { globalStore } from '@/api/stores'
import { useNavigate } from 'react-router-dom'

const PodcastSearchAtom = atom<{
  query: string
  resultEpisodes?: IItunesPodcast[]
  resultPodcasts?: IItunesPodcast[]
}>({
  query: ''
})
const searchResults = (query?: string) => {
  const q = query ?? globalStore.get(PodcastSearchAtom).query
  if (q) {
    fetch(`https://itunes.apple.com/search?media=podcast&entity=podcast&term=${q}&limit=100&country=cn`)
      .then(res => res.json())
      .then(data => {
        globalStore.set(PodcastSearchAtom, { ...globalStore.get(PodcastSearchAtom), resultPodcasts: data.results })
      })
    fetch(`https://itunes.apple.com/search?media=podcast&entity=podcastEpisode&term=${q}&limit=100&country=cn`)
      .then(res => res.json())
      .then(data => {
        globalStore.set(PodcastSearchAtom, { ...globalStore.get(PodcastSearchAtom), resultEpisodes: data.results })
      })
  }
}
const PodcastSearch = memo(() => {
  const [searchState, setSearchState] = useGlobalAtom(PodcastSearchAtom)
  const instance = usePodcastInstance()
  const containerRef = useRef<HTMLElement>(null)
  const navigate = useNavigate()
  useElementScrollRestore({
    elementRef: containerRef,
    elementKey: 'podcast-search'
  })
  return (
    <div ref={containerRef} className={'w-full h-full flex-col flex overflow-y-auto'}>
      <div className={'flex gap-4 w-full sticky top-0 pt-6 pb-2 px-6 z-10 bg-global'}>
        <input
          onKeyDown={e => {
            if (isHotkey(KEY.Enter, e)) {
              searchResults()
            }
          }}
          value={searchState.query}
          placeholder={'Type name...'}
          onChange={e => setSearchState(s => ({ ...s, query: e.target.value }))}
          className={'focus-input grow border-box-shadow h-10 px-3 py-2 rounded-md'}
        />
        <div
          onClick={() => searchResults()}
          className={'reverse-theme-button shadow cursor-pointer h-10 pr-5 pl-4 gap-2 py-2 flex items-center'}
        >
          <Icon name={'park-search'} />
          <span>Search</span>
        </div>
      </div>
      <Tabs
        defaultActiveKey={'podcast'}
        tabNavMode={'underline'}
        container={false}
        tabNavContainerStyle={{
          top: '4.5rem'
        }}
        tabNavContainerClassname={'!sticky px-6 top-18 z-10 bg-global'}
        tabNavClassname={'!px-3 !py-1.5 transition-all !bg-transparent !text-base'}
      >
        <TabPane style={{ height: 'auto' }} key={'podcast'} tab={'Podcasts'}>
          <div className={'flex-col flex p-3'}>
            {searchState.resultPodcasts?.map(p => (
              <PodcastItem
                onClick={() => {
                  instance.actionOps?.addItunesPodcast?.(p).then(res => {
                    navigate('/podcast/' + res.id)
                    usePodcastState.setState(s => ({
                      ...s,
                      currentPodcast: res.id
                    }))
                  })
                }}
                className={'w-full hover-bg-hover cursor-pointer p-3 rounded-md'}
                item={p}
                key={p.id}
              />
            ))}
          </div>
        </TabPane>
        <TabPane style={{ height: 'auto' }} key={'episode'} tab={'Episodes'}>
          <div className={'flex-col flex p-3'}>
            {searchState.resultEpisodes?.map(p => (
              <PodcastItem
                onClick={() => {
                  console.log(p)
                  instance.actionOps?.addItunesPodcast?.(p).then(res => {
                    navigate(`/episode/${res.id}`)
                  })
                }}
                showReleaseAndDur
                className={'w-full hover-bg-hover cursor-pointer p-3 rounded-md'}
                item={p}
                key={p.id}
              />
            ))}
          </div>
        </TabPane>
      </Tabs>
    </div>
  )
})

const usePodcastSearch = () => useGlobalAtom(PodcastSearchAtom)
PodcastSearch.usePodcastSearch = usePodcastSearch
PodcastSearch.searchResults = searchResults
export default PodcastSearch as typeof PodcastSearch & {
  searchAtom: typeof PodcastSearchAtom
  usePodcastSearch: typeof usePodcastSearch
  searchResults: typeof searchResults
}
