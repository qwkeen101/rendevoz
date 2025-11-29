import { memo, useLayoutEffect } from 'react'
import useFeedInstance from '@/core/components/feed/hooks/useFeedInstance'
import useFeedData from '@/core/components/feed/hooks/useFeedData'
import useFeedState from '../hooks/useFeedState'
import NewsChannelChanger from './NewsChannelChanger'
import NewsLanguageChanger from './NewsLanguageChanger'
import NewsContainer from './NewsContainer'
import { DotLoading } from '@/components'

export default memo(() => {
  const instance = useFeedInstance()
  const [state, setState] = useFeedState()
  const data = useFeedData()

  useLayoutEffect(() => {
    instance.newsOps?.fetchStories().then(res => {
      setState(s => ({ ...s, dashboardNews: res }))
    })
  }, [data.language, data.region, data.channel])

  return (
    <div className='p-8 pt-6 min-h-full flex flex-col w-full'>
      <div className='flex gap-6 mb-6 -ml-2'>
        <NewsChannelChanger />
        <NewsLanguageChanger />
      </div>
      {state.dashboardNews.length ? (
        <NewsContainer key={state.dashboardNews.length} items={state.dashboardNews} />
      ) : (
        <div className='flex items-center justify-center flex-1'>
          <DotLoading />
        </div>
      )}
    </div>
  )
})
