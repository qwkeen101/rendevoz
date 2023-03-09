import { Content } from '@/components'
import Database from '@/components/database'
import TabTitle from '@/components/layout/TabTitle'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'

const DatabasePage = () => {
  const { t } = useTranslation()
  return (
    <Content fullHeight fullWidth role="data-container">
      <TabTitle title={t('general.database')} />
      <Database />
    </Content>
  )
}

export default memo(DatabasePage)
