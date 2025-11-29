import { memo, useEffect, useState } from 'react'
import calculateAppearIn from '@/core/search/calculateAppearIn'
import { MetaStore } from '@/api/stores'
import { InlineObject } from '@/core'
import gotoContainedObject from '@/core/object/gotoContainedObject'
export default memo(
  ({ metaId, visible, onChange }: { metaId: number; visible?: boolean; className?: string; onChange?: (v: number) => void }) => {
    const [backlinks, setBacklinks] = useState<Awaited<ReturnType<typeof calculateAppearIn>>>()
    const index = MetaStore.useIndexedMetaLinks()
    useEffect(() => {
      if (visible) {
        calculateAppearIn([metaId]).then(appears => {
          setBacklinks(appears)
          onChange?.(Object.values(appears).flat(1).length)
        })
      }
    }, [metaId, visible, index?.relatedIdsMap])
    if (backlinks) {
      const items = Object.values(backlinks).flat(1)
      if (!items.length) return null
      return (
        <div className={'flex flex-col gap-1.5 w-full min-h-60'}>
          {items.map(i => (
            <Item parentMetaId={metaId} metaId={i.parent.id} key={i.parent.id} />
          ))}
        </div>
      )
    }
    return null
  }
)

const Item = ({ metaId, parentMetaId }: { metaId: number; parentMetaId: number }) => {
  const m = MetaStore.useValue(metaId)
  if (m && !m.deleted) {
    return (
      <InlineObject
        id={metaId}
        onClick={() => {
          Global.metaOps?.closeDetails?.()
          Global.searchOps?.closeSearchPanel()
          gotoContainedObject(metaId, parentMetaId)
        }}
      />
    )
  }
  return null
}
