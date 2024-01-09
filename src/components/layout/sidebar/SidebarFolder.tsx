import { Content } from '@/components'
import SidebarPinned from '@/components/layout/sidebar/SidebarPinned'
import SidebarCollection from '@/components/layout/sidebar/SidebarCollection'
import { ClassName } from 'rendevoz'
import { useTranslation } from 'react-i18next'
import FontSize from '@/consts/font'

const SidebarFolder = () => {
  const { t } = useTranslation()
  return (
    <Content fullHeight flex column fullWidth style={{ padding: '12px', overflowY: 'auto' }}>
      <div className={ClassName.title(FontSize['14px'])}>{t('general.collection')}</div>
      <div className={ClassName.description()} style={{ marginBottom: '20px' }}>
        {t('general.drag object to add into collections')}
      </div>
      {/*<SidebarTags />*/}
      <SidebarPinned />
      <SidebarCollection />
    </Content>
  )
}

export default SidebarFolder
