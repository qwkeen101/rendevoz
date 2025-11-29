import { memo } from 'react'
import { useUpdateEffect } from '@/hooks'
import useFeedInstance from '@/core/components/feed/hooks/useFeedInstance'
import { EmptyList } from '@/core/components'
import { DotLoading } from '@/components'
import useFeedState from '../hooks/useFeedState'
import NewsContainer from './NewsContainer'

export default memo(() => {
  const [state, setState] = useFeedState()
  useUpdateEffect(() => {
    instance.scrollElementRef.current?.scrollTo({
      top: 0
    })
  }, [state.searchResults])
  const instance = useFeedInstance()
  return (
    <div className={'p-8 flex flex-col min-h-full'}>
      {state.searchResults ? (
        state.searchResults.length ? (
          <NewsContainer items={state.searchResults} />
        ) : (
          <EmptyList />
        )
      ) : (
        <div className={'flex items-center justify-center flex-1'}>
          <DotLoading />
        </div>
      )}
    </div>
  )
})
