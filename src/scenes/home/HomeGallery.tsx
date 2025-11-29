import { memo, RefObject, useMemo, useRef } from 'react'
import GalleryItem from '@/scenes/home/GalleryItem'
import { useMeasure } from '@/hooks'
import VirtualLoader from '@/core/components/common/VirtualLoader'
import { IHomeItem } from '@/scenes/home/useHomeItems'
import { EmptyList } from '@/core/components'
import useHomeConfig from '@/scenes/home/useHomeConfig'
import { compareStrings } from '@/utils'

const HomeGallery = memo(
  ({
    scrollElementRef,
    items,
    isEditing,
    onSelect,
    selected
  }: {
    scrollElementRef: RefObject<HTMLDivElement>
    selected: Set<number>
    onSelect: (id: number) => void
    isEditing: boolean
    items: IHomeItem[]
  }) => {
    const { gallerySort = 'nameAsc' } = useHomeConfig()
    const ref = useRef<HTMLDivElement>(null)
    const { width } = useMeasure(ref)
    const cols = Math.floor(width / 360) + 1
    const sortedItems = useMemo(() => {
      const sorted = items.toSorted((a, b) => {
        if (a.type !== b.type) {
          if (a.type === 'collection') return -1
          if (b.type === 'collection') return 1
          return 0
        } else {
          switch (gallerySort) {
            case undefined:
            case 'nameDsc':
              return compareStrings(b.name, a.name)
            case 'nameAsc':
              return compareStrings(a.name, b.name)
            case 'createDsc':
              return b.createdAt - a.createdAt
            case 'viewDsc':
              return (b.viewAt ?? -1) - (a.viewAt ?? -1)
          }
        }
      })
      return sorted
    }, [items, gallerySort])
    return (
      <div ref={ref} className={'w-full flex-1 flex flex-col pointer-events-none px-2'}>
        <GalleryPanel
          onSelect={isEditing ? onSelect : undefined}
          selected={selected}
          scrollElementRef={scrollElementRef}
          items={sortedItems}
          cols={cols}
        />
      </div>
    )
  }
)

const GalleryPanel = ({
  cols,
  scrollElementRef,
  items,
  selected,
  onSelect
}: {
  cols: number
  scrollElementRef: RefObject<HTMLDivElement>
  items: IHomeItem[]
  selected: Set<number>
  onSelect?: (id: number) => void
}) => {
  if (!items.length) return <EmptyList className={'flex-1'} />
  const rows = items.length % cols === 0 ? items.length / cols : Math.floor(items.length / cols) + 1
  return (
    <>
      <VirtualLoader
        size={260}
        hasMore={false}
        overscan={1}
        scrollElementRef={scrollElementRef}
        count={rows}
        renderItem={idx => {
          const sliced = items.slice(idx * cols, (idx + 1) * cols)
          return (
            <div
              style={{
                gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`
              }}
              className={'grid gap-6 pb-6'}
            >
              {sliced.map(i => (
                <GalleryItem
                  contextMenu={i.contextMenu}
                  selected={selected.has(i.id)}
                  onSelect={
                    onSelect
                      ? () => {
                          onSelect(i.id)
                        }
                      : undefined
                  }
                  id={i.id}
                  type={i.type}
                  key={i.id}
                />
              ))}
            </div>
          )
        }}
      ></VirtualLoader>
    </>
  )
}
export default HomeGallery
