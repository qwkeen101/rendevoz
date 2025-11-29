import { useLocation, useSearchParams } from 'react-router-dom'
import { DotLoading } from '@/components'
import { useLayoutEffect, useState } from 'react'
import { useNorepeatNavigate } from '@/hooks'
import useFeedInstance from '@/core/components/feed/hooks/useFeedInstance'
import { INews } from '~/typings'
import { ObjectStore } from '@/api/stores'

type Params =
  | {
      type: 'google'
    }
  | {
      type: 'feed'
      id: string
    }

export default () => {
  const params = Object.fromEntries(useSearchParams()[0].entries()) as Params
  const location = useLocation()
  const instance = useFeedInstance()
  const navigate = useNorepeatNavigate()
  const [target, setTarget] = useState('')

  useLayoutEffect(() => {
    if (params.type === 'google') {
      const state = location.state as INews
      instance.newsOps?.addNewsAsFeed(state, true).then(res => {
        if (res) {
          setTarget(`/feed/${res.id}`)
        }
      })
    }
    if (params.type === 'feed') {
      ObjectStore('feed')
        .getOneById(Number(params.id))
        .then(async feed => {
          if (feed) {
            setTarget(`/feed/${feed.id}`)
          }
        })
    }
  }, [params])
  useLayoutEffect(() => {
    if (target) {
      navigate(target, { replace: true })
    }
  }, [target])
  return (
    <div className={'w-full h-full flex items-center justify-center'}>
      <DotLoading />
    </div>
  )
}
