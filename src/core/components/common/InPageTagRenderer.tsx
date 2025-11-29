import { MetaStore, ObjectStore } from '@/api/stores'
import { ObjectTag } from '@/core'
import { AnimatePopover, WithBorder } from '@/components'
import MetaTagPicker from '@/core/object/MetaTagPicker'
import { CSSProperties } from 'react'
import classnames from 'classnames'
export default ({
  metaId,
  className,
  style,
  onClick
}: {
  metaId: number
  className?: string
  style?: CSSProperties
  onClick?: React.MouseEventHandler
}) => {
  const meta = MetaStore.useValue(metaId)
  const tags = ObjectStore('tag').useMultiple(meta?.tags)
  if (!meta) return null
  if (!tags.length) return null
  return (
    <AnimatePopover
      padding={6}
      align={'start'}
      positions={['bottom', 'top']}
      content={setV => (
        <WithBorder onClick={onClick}>
          <MetaTagPicker
            alreadyTags={meta?.tags}
            onChange={v => {
              MetaStore.updateMetaObject({ id: metaId, tags: v })
            }}
          />
        </WithBorder>
      )}
    >
      <div onClick={onClick} style={style} className={classnames('flex cursor-pointer em:text-sm em:gap-2.5 flex-wrap', className)}>
        {tags.map(i => (
          <ObjectTag square small hideDelete tag={i.id} key={i.id} />
        ))}
      </div>
    </AnimatePopover>
  )
}
