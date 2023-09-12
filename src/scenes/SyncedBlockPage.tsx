import { Content } from '@/components'
import SyncedBlockEditor from '@/core/editor/SyncedBlockEditor'

const SyncedBlockPage = ({ metaId }: { metaId: number }) => {
  return (
    <Content fullHeight fullWidth>
      <SyncedBlockEditor syncedBlockMetaId={metaId} />
    </Content>
  )
}

export default SyncedBlockPage
