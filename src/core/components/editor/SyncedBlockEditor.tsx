import SimpleEditor from '@/core/components/editor/SimpleEditor'

const SyncedBlockEditor = ({ syncedBlockMetaId }: { syncedBlockMetaId: number }) => {
  return (
    <SimpleEditor
      value={[{ type: 'synced', originId: syncedBlockMetaId, id: 1, children: [{ text: '' }], syncVersion: 0 }]}
    />
  )
}

export default SyncedBlockEditor
