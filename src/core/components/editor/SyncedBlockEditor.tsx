import SimpleEditor from '@/core/components/editor/SimpleEditor'
import { CSSProperties } from 'react'

const SyncedBlockEditor = ({ syncedBlockMetaId, style }: { syncedBlockMetaId: number; style?: CSSProperties }) => {
  return (
    <SimpleEditor
      containerStyle={{ padding: '0px 0px 4px 8px', ...style }}
      value={[{ type: 'synced', originId: syncedBlockMetaId, id: 1, children: [{ text: '' }], syncVersion: 0 }]}
    />
  )
}

export default SyncedBlockEditor
