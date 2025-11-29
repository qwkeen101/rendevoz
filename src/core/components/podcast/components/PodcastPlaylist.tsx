import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Icon, IconWithPopover, WithBorder } from '@/components'
import { restrictToFirstScrollableAncestor, restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { ObjectStore } from '@/api/stores'
import { useMediaInstance } from '@/core/components/media/hooks/useMediaInstance'
import usePodcastInstance from '@/core/components/podcast/hooks/usePodcastInstance'
import { CSS } from '@dnd-kit/utilities'
import { normalizeSecondsToTime } from '@/core/components/media/utils'
import { Icons } from '@/consts'
import PodcastMenu from '@/core/components/podcast/menu/PodcastMenu'

const BUTTON_CLASS = 'text-white opacity-60 hover:opacity-80 cursor-pointer transition-opacity'
const BUTTON_SIZE = 24

export default ({ items, onChange, isPlaying }: { items: number[]; onChange?: (items: number[]) => void; isPlaying?: number }) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )
  return (
    <WithBorder
      style={{
        width: 400,
        maxHeight: '600px'
      }}
      className={'flex flex-col gap-1 p-2 overflow-y-auto border-bottom'}
    >
      <DndContext
        sensors={sensors}
        modifiers={[restrictToFirstScrollableAncestor, restrictToVerticalAxis, restrictToParentElement]}
        collisionDetection={closestCenter}
        onDragEnd={event => {
          const { active, over } = event

          if (active.id !== over?.id) {
            const oldIndex = items.indexOf(active.id)
            const newIndex = items.indexOf(over.id)
            onChange?.(arrayMove(items, oldIndex, newIndex))
          }
        }}
      >
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          {items.map(i => (
            <EpisodeItem isPlaying={i === isPlaying} id={i} key={i} />
          ))}
        </SortableContext>
      </DndContext>
    </WithBorder>
  )
}

const EpisodeItem = ({ id, isPlaying }: { id: number; isPlaying?: boolean }) => {
  const { attributes, listeners, setNodeRef, transform } = useSortable({ id })
  const episode = ObjectStore('episode').useValue(id)
  const instance = useMediaInstance()
  const podcastInstance = usePodcastInstance()
  const style = {
    transform: CSS.Transform.toString(transform)
  }
  return (
    <div ref={setNodeRef} className={'flex gap-x-3 items-center cursor-auto p-1'} style={style} {...attributes}>
      <Icon name={'park-drag'} className={'transparent-font cursor-grab hover-primary-color'} {...listeners} />
      {episode?.thumbnail && (
        <img src={episode.thumbnail} width={48} height={48} className={'object-cover shadow rounded flex-shrink-0 w-10 h-10'} />
      )}
      <div className={'flex flex-col gap-0.5'}>
        <div
          onClick={() => {
            podcastInstance.actionOps?.openEpisode?.(id)
          }}
          className={'text-sm line-clamp-1 cursor-pointer'}
        >
          {episode?.name}
        </div>
        {episode && (
          <div className={'text-xs font-mono transparent-font leading-tight'}>
            {normalizeSecondsToTime(episode?.currentTime ?? 0)}/{normalizeSecondsToTime(episode?.duration ?? 0)}
          </div>
        )}
      </div>
      <div className={'ml-auto items-center flex gap-2'}>
        <IconWithPopover
          name={Icons.More}
          size={BUTTON_SIZE}
          align={'start'}
          className={BUTTON_CLASS}
          placement={['right', 'left']}
          content={setV => <PodcastMenu type={'episode'} id={id} onClose={() => setV(false)} />}
        ></IconWithPopover>
      </div>
    </div>
  )
}
