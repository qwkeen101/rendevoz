import { memo, useEffect, useState } from 'react'
import getHiddenBy, { IHiddenBy } from '@/api/stores/meta/getHiddenBy'
import trans from '@/consts/trans'
import { useTranslation } from 'react-i18next'
import { Icon, Switch } from '@/components'
import { MetaStore } from '@/api/stores'
import { InlineObject } from '@/core'

export default memo(({ id, hidden, onChange }: { id: number; hidden: boolean; onChange: (v: boolean) => void }) => {
  const [hiddenBy, setHiddenBy] = useState<IHiddenBy[]>()
  const { t } = useTranslation()
  useEffect(() => {
    getHiddenBy().then(res => {
      const h = res.get(id)
      if (h) {
        setHiddenBy(h.filter(i => i.metaId !== id))
      }
    })
  }, [])
  return (
    <div>
      <div className={'flex justify-between items-center'}>
        <div className={'font-size-12 transparent-font'}>{t('general.Hide file')}</div>
        <Switch value={hidden} onChange={onChange} />
      </div>
      {hiddenBy?.length ? (
        <div className={'p-2 bg-third rounded-lg mt-2'}>
          <div className={'transparent-font flex items-center gap-1 font-size-11 mb-1.5'}>
            <Icon strokeWidth={4} name={'park-attention'} />
            {t('general.Unhide desc')}
          </div>
          {hiddenBy.map(i => (
            <InlineObject id={i.metaId} key={i.metaId} />
          ))}
        </div>
      ) : null}
    </div>
  )
})
