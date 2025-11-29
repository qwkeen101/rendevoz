import { IItunesPodcast } from '@/core/components/feed/utils/service/podcasts'
import { Content } from '@/components'
import { useMeasure } from '@/hooks'
import PodcastItem from '@/core/components/feed/components/podcast/PodcastItunesItem'
import { useRef } from 'react'

export default ({ items, onClick }: { items: IItunesPodcast[]; onClick?: (i: IItunesPodcast) => void }) => {
  const ref = useRef<HTMLDivElement>(null)
  const { width } = useMeasure(ref)
  const cols = Math.min(Math.floor(width / 600) + 1, 2)
  return (
    <div className={'p-6 h-full overflow-y-auto pb-40'}>
      <div
        style={{
          display: 'grid',
          gap: 12,
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr)`
        }}
        ref={ref}
      >
        {items.map(o => (
          <PodcastItem onClick={() => onClick?.(o)} className="button p-6px flex-shrink-0 w-full overflow-hidden" item={o} key={o.id} />
        ))}
      </div>
    </div>
  )
}
