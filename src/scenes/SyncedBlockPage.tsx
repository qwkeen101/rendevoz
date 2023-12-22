import { Content, Icon } from '@/components'
import SyncedBlockEditor from '@/core/components/editor/SyncedBlockEditor'
import { MetaStore } from '@/api/stores'
import { TabTitle } from '@/core/rendevoz/components'
import { Rendevoz } from '@/core/rendevoz'

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
        <TabTitle
          title={syncMeta.name || syncMeta.placeholderName || 'Unnamed synced block'}
          icon={<Icon name={Rendevoz.Utils.Object.getMetaObjectIcon('syncedBlock')} />}
        />
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
