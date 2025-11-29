import { IItunesPodcast } from '@/core/components/podcast/services/podcasts'
import PodcastItem from '@/core/components/podcast/PodcastItunesItem'

export default ({ items, onClick }: { items: IItunesPodcast[]; onClick?: (i: IItunesPodcast) => void }) => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fill, minmax(400px, 1fr))`
      }}
      className={'gap-6 w-full pb-40'}
    >
      {items.map(o => (
        <PodcastItem onClick={() => onClick?.(o)} item={o} key={o.id} />
      ))}
    </div>
  )
}
