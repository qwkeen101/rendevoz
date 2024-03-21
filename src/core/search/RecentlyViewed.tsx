import { MetaStore } from '@/api/stores'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Content } from '@/components'
import { Rendevoz } from '@/core/rendevoz'
import { MetaObject } from '~/typings'

const RecentlyViewed = ({ onClose, visible }: { onClose: VoidFunction; visible: boolean }) => {
  const [recentlyViewed, setRecentlyViewed] = useState<MetaObject[]>([])
  useEffect(() => {
    if (visible) {
      const allMetas = MetaStore.getMetaObjectsMap()
      const allObjects = Array.from(allMetas.values()).filter(i => i.viewAt)
      allObjects.sort((b, a) => (a.viewAt || 0) - (b.viewAt || 0))
      setRecentlyViewed(allObjects.slice(0, 5))
    }
  }, [visible])
  const { t } = useTranslation()
  if (!recentlyViewed.length) return null
  return (
    <Content flex column style={{ padding: 6 }}>
      <div className={'font-size-12 transparent-font'} style={{ paddingLeft: '0.5em', marginBottom: '0.3em' }}>
        {t('general.recentlyViewed')}
      </div>
      {recentlyViewed.map(i => (
        <Button.IconButton
          icon={Rendevoz.Utils.Object.getMetaObjectIcon(i.type)}
          text={i.name || i.placeholderName}
          key={i.id}
          onClick={() => {
            Rendevoz.Actions.Open.Meta.openMetaObject(i.id)
            onClose()
          }}
          className={'font-size-13'}
          style={{ padding: '4px 6px' }}
        ></Button.IconButton>
      ))}
    </Content>
  )
}

export default RecentlyViewed
