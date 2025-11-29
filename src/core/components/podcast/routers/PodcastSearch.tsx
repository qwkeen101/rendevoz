import { useGlobalAtom, useMeasure } from '@/hooks'
import { Tabs, TabPane, useElementScrollRestore } from '@/components'
import { memo, useRef } from 'react'
import usePodcastInstance from '@/core/components/podcast/hooks/usePodcastInstance'
import { useTranslation } from 'react-i18next'
import NoResult from '@/core/components/common/NoResult'
import { Tab } from '@/components/base/tabs'
import PodcastItunesItem from '@/core/components/podcast/PodcastItunesItem'
import classNames from 'classnames'

const PodcastSearch = memo(() => {
  const instance = usePodcastInstance()
  const [searchState, setSearchState] = useGlobalAtom(instance.searchAtom)
  const containerRef = useRef<HTMLElement>(null)
  const { t } = useTranslation()
  const { width } = useMeasure(containerRef)
  const cols = Math.floor(width / 200)
  const renderPodcasts = () => {
    if (searchState.resultPodcasts?.length) {
      return (
        <div>
          <div className='font-bold text-3xl hover:underline cursor-pointer mb-8'>播客</div>
          <div
            style={{
              '--grid-cols': '5',
              '--column-gap': '20px',
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
              columnGap: 'var(--column-gap)',
              rowGap: 24
            }}
            className='grid overflow-hidden'
          >
            {searchState.resultPodcasts.slice(0, 2 * cols).map(i => (
              <PodcastItunesItem
                onClick={() => {
                  instance.actionOps?.load('podcast', i.trackViewUrl!)
                }}
                item={i}
                columnMode
                columnSize='!w-full !h-full'
              />
            ))}
          </div>
        </div>
      )
    }
  }
  const renderEpisodes = () => {
    if (searchState.resultEpisodes?.length) {
      return (
        <div>
          <div className='font-bold text-3xl hover:underline cursor-pointer mb-5'>单集</div>
          <div className='flex flex-col -mx-3'>
            {searchState.resultEpisodes.map((i, idx, arr) => (
              <PodcastItunesItem
                play={() => {
                  instance.actionOps?.addItunesEpisode(i.trackViewUrl!).then(re => {
                    instance.actionOps?.playEpisode(re.id)
                  })
                }}
                detailsMode
                className={classNames(idx === arr.length - 1 ? '' : 'border-bottom', '!py-5')}
                onClick={() => {
                  instance.actionOps?.load('episode', i.trackViewUrl!)
                }}
                item={i}
              />
            ))}
          </div>
        </div>
      )
    }
  }
  console.log(searchState)
  return (
    <div ref={containerRef} className={'w-full p-8 flex-col gap-8 flex'}>
      {renderPodcasts()}
      {renderEpisodes()}
    </div>
  )
})

export default PodcastSearch
