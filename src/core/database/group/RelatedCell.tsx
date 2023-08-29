import { MetaStore } from '@/stores'
import { Content } from '@/components'

const RelatedCell = ({ metaId }: { metaId: number }) => {
  const index = MetaStore.useIndexedMetaLinks()
  const relatedMap = index?.relatedIdsMap
  const size = relatedMap?.get(metaId)?.size || 0

  return <Content>{size}</Content>
}

export default RelatedCell
