import SimpleEditor from '@/core/components/editor/SimpleEditor'
import { CSSProperties, useMemo } from 'react'

const SyncedBlockEditor = ({
  syncedBlockMetaId,
  style,
  readOnly
}: {
  syncedBlockMetaId: number
  style?: CSSProperties
  readOnly?: boolean
}) => {
  return (
    <SimpleEditor
      textareaMode
      readOnly={readOnly}
      containerStyle={{ padding: '0px 4px 4px 8px', ...style }}
      value={useMemo(
        () => [{ type: 'synced', originId: syncedBlockMetaId, id: 1, children: [{ text: '' }], syncVersion: 0 }],
        [syncedBlockMetaId]
      )}
    />
  )
}

export default SyncedBlockEditor
