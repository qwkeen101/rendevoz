import { useParams, useSearchParams } from 'react-router-dom'
import { DotLoading } from '@/components'
import { useLayoutEffect, useState } from 'react'
import usePodcastInstance from '@/core/components/podcast/hooks/usePodcastInstance'
import { useNorepeatNavigate } from '@/hooks'

type PODCAST_LOADING_PARAMS = {
  type: 'episode' | 'podcast'
  url: string
}

export default () => {
  const params = Object.fromEntries(useSearchParams()[0].entries()) as PODCAST_LOADING_PARAMS
  const instance = usePodcastInstance()
  const navigate = useNorepeatNavigate()
  const [isFailed, setIsFailed] = useState(false)
  const [target, setTarget] = useState('')
  console.log(params)
  useLayoutEffect(() => {
    if (params.type === 'episode') {
      instance.actionOps?.addItunesEpisode(params.url).then(res => {
        setTarget(`/episode/${res.id}`)
      })
    }
    if (params.type === 'podcast') {
      instance.actionOps?.addItunesPodcast(params.url).then(res => {
        setTarget(`/podcast/${res.id}`)
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
