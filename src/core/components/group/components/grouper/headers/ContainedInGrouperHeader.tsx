import { memo } from 'react'
import { MetaStore } from '@/api/stores'
import { IconNameRenderer, ObjectActionMenu } from '@/core'
import ContextMenu from '@/components/contextMenu'
import { WithBorder } from '@/components'

export default memo(({ id, canOpen = false }: { id: number; canOpen?: boolean }) => {
  const meta = MetaStore.useValue(id)
  return (
    <ContextMenu
      content={setV => (
        <WithBorder>
          <ObjectActionMenu metaObjectId={id} onClose={() => setV(false)} />
        </WithBorder>
      )}
    >
      <IconNameRenderer
        onClick={() => {
          canOpen && Global.layoutOps?.openObject(id)
        }}
        gap={10}
        style={{
          maxWidth: canOpen ? '85%' : undefined
        }}
        className={canOpen ? 'hover-link' : undefined}
        icon={Global.utils.getIcon(meta?.type)}
        name={meta?.name || meta?.placeholderName || 'Unnamed'}
      />
    </ContextMenu>
  )
})
