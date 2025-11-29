import { MetaStore } from '@/api/stores'
import { useTranslation } from 'react-i18next'
import { InlineObject } from '@/core'

export default ({ metaId, className }: { metaId: number; className: string }) => {
  const parentItems = MetaStore.useIndexedMetaObjects()?.metaAttachmentIdToMetaIdsMap.get(metaId)
  const { t } = useTranslation()
  if (parentItems?.size) {
    return (
      <div className={'w-full'}>
        <div className={className}>{t('general.Parent items')}</div>
        {Array.from(parentItems.values()).map(i => (
          <InlineObject id={i} key={i} />
        ))}
      </div>
    )
  }
  return null
}
