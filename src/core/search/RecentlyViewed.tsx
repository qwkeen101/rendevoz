import { MetaStore } from '@/stores'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Content } from '@/components'
import { Rendevoz } from '@/core/rendevoz'
import FontSize from '@/consts/font'

const RecentlyViewed = () => {
  const allMetas = MetaStore.useMetaObjectsMap()
  const recentlyViewed = useMemo(() => {
    const allObjects = Array.from(allMetas.values()).filter(i => i.viewAt)
    allObjects.sort((b, a) => (a.viewAt || 0) - (b.viewAt || 0))
    return allObjects.slice(0, 6)
  }, [allMetas])
  const { t } = useTranslation()
  if (!recentlyViewed.length) return null
  return (
    <Content flex column style={{ lineHeight: 1.3, padding: 6 }}>
      <div style={{ fontSize: 12, paddingLeft: 6, marginBottom: 4 }}>{t('general.recentlyViewed')}</div>
      {recentlyViewed.map(i => (
        <Button.IconButton
          icon={Rendevoz.Utils.Object.getMetaObjectIcon(i.type)}
          text={i.name}
          key={i.id}
          onClick={() => {
            Rendevoz.Actions.Open.Meta.openMetaObject(i.id)
          }}
          style={{ fontSize: FontSize['13px'], padding: '4px 6px' }}
        ></Button.IconButton>
      ))}
    </Content>
  )
}

export default RecentlyViewed
