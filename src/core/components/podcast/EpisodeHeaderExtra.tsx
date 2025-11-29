import { Content, Icon } from '@/components'
import { IEpisode, IPodcast } from '@/core/components/feed/components/podcast/types'
import { useEffect, useState } from 'react'
import { ObjectStore } from '@/api/stores'
import { useNavigate } from 'react-router-dom'

export default ({ id, episodes, podcast }: { id?: number; podcast?: IPodcast; episodes?: number[] }) => {
  const navigate = useNavigate()
  const [next, setNext] = useState<IEpisode>()
  useEffect(() => {
    if (episodes?.length && id) {
      const currIdx = episodes.findIndex(o => o === id)
      if (currIdx >= 0) {
        const n = episodes[currIdx + 1]
        if (n) {
          ObjectStore('episode')
            .getOneById(n)
            .then(res => setNext(res))
          return
        }
      }
    }
    setNext(undefined)
  }, [episodes, id])
  return (
    <Content flex column className={'gap-y-2 items-center @4xl:items-start'}>
      {podcast && (
        <div
          onClick={() => {
            navigate(`/podcast/${podcast.id}`)
          }}
          className={'cursor-pointer flex items-center gap-2.5 w-fit group'}
        >
          {podcast.thumbnail && <img className={'w-6 h-6 rounded'} src={podcast.thumbnail} />}
          {podcast.name}
          <Icon name={'park-right'} className={'group-hover:translate-x-1 transition-transform icon-16'} />
        </div>
      )}
      {next && (
        <Content
          onClick={() => {
            navigate(`/episode/${next!.id}`, {
              replace: true
            })
          }}
          className={'transparent-font cursor-pointer transition-all hover:underline'}
        >
          Next: {next.name}
        </Content>
      )}
    </Content>
  )
}
