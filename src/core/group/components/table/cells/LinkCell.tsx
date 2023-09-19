import { MetaStore } from '@/stores'
import { Content } from '@/components'
import usePopoverCell from '@/core/group/hooks/usePopoverCell'
import { useRef } from 'react'
import RelatedRenderer from '@/core/group/components/popupRenderer/RelatedRenderer'
import { PopupWrapper } from '@/core/group/components'

export const OutLinkCell = ({ metaId }: { metaId: number }) => {
  const index = MetaStore.useIndexedMetaLinks()
  const map = index?.sourceIdToTargetIdsMap

  const ref = useRef<HTMLElement>(null)
  const { openPopover, renderPopover } = usePopoverCell({
    targetRef: ref
  })
  if (!map) return null
  const size = map.get(metaId)?.size || 0
  return (
    <>
      <Content
        data-table-out-link={metaId}
        onClick={() => {
          openPopover(ref.current, box => (
            <PopupWrapper box={box}>
              <RelatedRenderer metaId={metaId} direction={'out'} />
            </PopupWrapper>
          ))
        }}
        ref={ref}
      >
        {size}
      </Content>
      {renderPopover()}
    </>
  )
}

export const InLinkCell = ({ metaId }: { metaId: number }) => {
  const index = MetaStore.useIndexedMetaLinks()
  const map = index?.targetIdToSourceIdsMap
  const ref = useRef<HTMLElement>(null)
  const { openPopover, renderPopover } = usePopoverCell({
    targetRef: ref
  })
  if (!map) return null
  const size = map.get(metaId)?.size || 0
  return (
    <>
      <Content
        data-table-in-link={metaId}
        onClick={() => {
          openPopover(ref.current, box => (
            <PopupWrapper box={box}>
              <RelatedRenderer metaId={metaId} direction={'in'} />
            </PopupWrapper>
          ))
        }}
        ref={ref}
      >
        {size}
      </Content>
      {renderPopover()}
    </>
  )
}
