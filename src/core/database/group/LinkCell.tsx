import { MetaStore } from '@/stores'
import { Content } from '@/components'
import usePopoverCell from '@/core/database/group/hooks/usePopoverCell'
import { useRef } from 'react'


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
      <Content ref={ref}>{size}</Content>
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
      <Content ref={ref}>{size}</Content>
      {renderPopover()}
    </>
  )
}
