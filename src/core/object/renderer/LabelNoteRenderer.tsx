import { MetaStore } from '@/api/stores'
import { memo } from 'react'
import { Markdown } from '@/components'
import { useTranslation } from 'react-i18next'

export default memo(({ id }: { id: number }) => {
  const meta = MetaStore.useObjectToMetaValue(id)
  const { t } = useTranslation()
  if (meta) {
    if (meta.name) {
      return (
        <div className={'px-3 py-2 border-bottom font-size-13 max-w-lg max-h-72 overflow-y-auto'}>
          <div className={'menu-sub-title mb-1'}>{t('general.Highlight note')}</div>
          <Markdown>{meta.name}</Markdown>
        </div>
      )
    }
  }
})
