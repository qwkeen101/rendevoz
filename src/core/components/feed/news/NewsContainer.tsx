import { INews } from '~/index'
import useFeedInstance from '../hooks/useFeedInstance'
import { usePositioner, useResizeObserver, useMasonry } from 'masonic'
import { useMeasure } from '@/hooks'
import { useScroll, useScrolling } from 'react-use'
import { useRef } from 'react'

export default ({ items }: { items: INews[] }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const instance = useFeedInstance()
  const { width, height } = useMeasure(containerRef)
  const { y: scrollTop } = useScroll(instance.scrollElementRef)
  const isScrolling = useScrolling(instance.scrollElementRef)
  const positioner = usePositioner({
    width,
    columnWidth: 300,
    columnGutter: 20
  })
  const resizeObserver = useResizeObserver(positioner)
  return (
    <div className='w-full' ref={containerRef}>
      {useMasonry({
        positioner,
        resizeObserver,
        items,
        height,
        scrollTop,
        isScrolling,
        overscanBy: 6,
        render: props => <Item {...props.data} />
      })}
    </div>
  )
}
const Item = (props: INews) => {
  const instance = useFeedInstance()
  const { image, title, source, favicon, time, description } = props
  return (
    <div
      onClick={() => {
        instance.newsOps?.addNewsAsFeed(props).then(i => {
          instance.feedOps?.read(i.id)
        })
      }}
      className='flex bg-secondary light-hover cursor-pointer overflow-hidden rounded-xl flex-col'
    >
      {image && <img src={image} className='aspect-video w-full' />}
      <div className='p-4'>
        <div className='font-size-12 mb-1 flex font-bold items-center gap-2.5'>
          {favicon && <img src={favicon} className='size-5 object-cover aspect-video rounded-sm' />}
          <span>
            {source} • {DateFormat.formatTime(time)}
          </span>
        </div>
        <div className='font-bold font-size-16'>{title}</div>
        {!image && description && <div className='line-clamp-3 mt-1' dangerouslySetInnerHTML={{ __html: description }}></div>}
      </div>
    </div>
  )
}
