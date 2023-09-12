import SimpleEditor from '@/core/editor/SimpleEditor'

const SyncedBlockEditor = ({ syncedBlockMetaId }: { syncedBlockMetaId: number }) => {
  return (
    <SimpleEditor
      type={'syncedBlock'}
      value={[{ type: 'synced', originId: syncedBlockMetaId, id: 1, children: [{ text: '' }], syncVersion: 0 }]}
    />
  )
}

export default SyncedBlockEditor
