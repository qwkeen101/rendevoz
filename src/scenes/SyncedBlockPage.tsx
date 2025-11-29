import { Content, Icon, TabTitle } from '@/components'
import SyncedBlockEditor from '@/core/components/editor/SyncedBlockEditor'
import { MetaStore } from '@/api/stores'

const SyncedBlockPage = ({ id }: { id: number }) => {
  const syncMeta = MetaStore.useObjectToMetaValue(id)
  if (syncMeta) {
    return (
      <Content
        fullHeight
        fullWidth
        style={{
          margin: '0 auto',
          maxWidth: '800px',
          padding: '60px 0px 20px'
        }}
      >
        <TabTitle title={syncMeta.name} icon={<Icon name={Global.utils.getIcon('syncedBlock')} />} />
        <SyncedBlockEditor
          style={{
            height: '100%'
          }}
          syncedBlockMetaId={syncMeta.id}
        />
      </Content>
    )
  }
}

export default SyncedBlockPage
