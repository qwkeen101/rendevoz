import { useRef } from 'react'
import usePopoverCell from '@/core/group/hooks/usePopoverCell'
import { Content } from '@/components'
import MetaTagPicker from '@/core/database/MetaTagPicker'
import { Colors } from '@/consts'
import Tag from '@/core/database/ObjectTag'
import { MetaStore } from '@/stores'
import { useGroupInstance } from '@/core/group/hooks/useGroupInstance'

const TagCell = ({ value = [], metaId, wrap }: { value: number[]; metaId: number; wrap?: boolean }) => {
  const tagRef = useRef<HTMLDivElement>(null)
  const { openPopover, renderPopover } = usePopoverCell({
    targetRef: tagRef
  })
  const metaObject = MetaStore.useValue(metaId)
  const instance = useGroupInstance()
  return (
    <>
      <Content
        flex
        fullWidth
        gap={4}
        style={{ flexWrap: wrap ? 'wrap' : 'nowrap', overflow: 'hidden', height: 'fit-content', minHeight: 24 }}
        alignItems="center"
        onClick={e => {
          const parent = e.currentTarget.parentElement
          if (parent) {
            openPopover(parent)
          }
        }}
      >
        {value.map(i => (
          <Tag hideDelete square hideSize tag={i} key={i} />
        ))}
      </Content>
      {renderPopover(box => (
        <MetaTagPicker
          ref={tagRef}
          style={{
            boxShadow: Colors.Background.BoxShadow,
            background: Colors.Background.Secondary,
            borderRadius: 4,
            left: box?.left,
            top: box?.top,
            width: box?.width,
            position: 'fixed'
          }}
          onChange={v => instance.metaOps?.updateMeta({ id: metaId, tags: v })}
          alreadyTags={metaObject?.tags}
        />
      ))}
    </>
  )
}

export default TagCell
