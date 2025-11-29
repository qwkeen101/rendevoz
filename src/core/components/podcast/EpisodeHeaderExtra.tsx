import { Icon } from '@/components'
import { ObjectStore } from '@/api/stores'
import { useNavigate, useInRouterContext } from 'react-router-dom'

export default ({ id }: { id?: number }) => {
  const inRouter = useInRouterContext()
  const navigate = inRouter && useNavigate()
  const episode = ObjectStore('episode').useValue(id)
  const podcast = ObjectStore('podcast').useValue(episode?.podcastId)

  return (
    <>
      {podcast && (
        <div
          onClick={() => {
            if (navigate) {
              navigate(`/podcast/${podcast.id}`)
            } else {
              Global.layoutOps?.openPage('podcast').then(i => {
                i.navigate?.(`/podcast/${podcast.id}`)
              })
            }
          }}
          className={'cursor-pointer select-none flex items-center gap-2 w-fit group'}
        >
          {podcast.thumbnail && <img className={'w-6 mr-1 h-6 rounded'} src={podcast.thumbnail} />}
          {podcast.name}
          <Icon strokeWidth={4} name={'park-right'} className={'group-hover:opacity-100 opacity-0 transition-all icon-16'} />
        </div>
      )}
    </>
  )
}
