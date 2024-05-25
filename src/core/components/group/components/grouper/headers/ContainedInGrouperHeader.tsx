import { memo } from 'react'
import { MetaStore } from '@/api/stores'
import { IconNameRenderer } from '@/core'
import { Rendevoz } from '@/core/rendevoz'
import { GlobalInstance } from '@/hooks'

export default memo(({ id, canOpen = false }: { id: number; canOpen?: boolean }) => {
  const meta = MetaStore.useValue(id)
  return (
    <IconNameRenderer
      onClick={() => {
        canOpen && GlobalInstance.layoutOps?.openObject(id)
      }}
      style={{
        maxWidth: canOpen ? '85%' : undefined
      }}
      className={canOpen ? 'hover-link' : undefined}
      icon={Rendevoz.Utils.Object.getMetaObjectIcon(meta?.type)}
      name={meta?.name || meta?.placeholderName || 'Unnamed'}
    />
  )
})
