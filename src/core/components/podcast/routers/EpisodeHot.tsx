import usePodcastState from '@/core/components/podcast/hooks/usePodcastState'
import { useEffect } from 'react'
import PodcastList from '@/core/components/podcast/PodcastList'
import usePodcastInstance from '@/core/components/podcast/hooks/usePodcastInstance'
import usePodcastData from '@/core/components/podcast/hooks/usePodcastData'
import { useTranslation } from 'react-i18next'
import { DotLoading } from '@/components'

export default () => {
  const episodes = usePodcastData().dashboard?.episodes ?? []
  const instance = usePodcastInstance()
  const { t } = useTranslation()
  useEffect(() => {
    usePodcastState.apis.fetchHotAndEpisodes({
      hot: false
    })
  }, [])
  return (
    <div className={'p-8'}>
      <div className={'text-3xl font-bold mb-8'}>{t('podcast.Hot episodes')}</div>
      {episodes.length ? (
        <PodcastList
          items={episodes}
          onClick={i => {
            instance.actionOps?.load?.('episode', i.url)
          }}
        />
      ) : (
        <div className={'flex-1 w-full flex items-center justify-center'}>
          <DotLoading />
        </div>
      )}
    </div>
  )
}
