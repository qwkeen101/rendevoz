import InnerContentDisplayer from '@/core/components/group/components/gallery/items/InnerContentDisplayer'
import { MetaStore } from '@/api/stores'
import { memo } from 'react'
import useGraph from '@/core/components/graph/hooks/useGraph'

export default memo(({ id }: { id: number }) => {
  const m = MetaStore.useValue(id)
  const graph = useGraph()
  return (
    <div
      onPointerLeave={e => {
        graph.overlayManager?.setOverlayState(s => ({ ...s, visible: false }))
      }}
      id={'graph-content-displayer'}
      className={'relative'}
    >
      <div className={'absolute pointer-events-none top-0 -translate-y-full transparent-font font-size-12 pb-1 line-clamp-1 max-w-64'}>{m?.name || m?.placeholderName}</div>
      <InnerContentDisplayer mode={'content'} scrollableNote className={'w-80 h-64 overflow-y-auto'} metaId={id} imageFit={'cover'} />
    </div>
  )
})
