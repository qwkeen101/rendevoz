import { Content } from '@/components'
import SidebarPinned from '@/components/layout/sidebar/SidebarPinned'
import SidebarCollection from '@/components/layout/sidebar/SidebarCollection'
import { ClassName } from 'rendevoz'
import { useTranslation } from 'react-i18next'
import FontSize from '@/consts/font'

const SidebarFolder = () => {
  const { t } = useTranslation()
  return (
    <Content fullHeight flex column fullWidth style={{ overflowY: 'auto' }}>
      <SidebarPinned />
      <SidebarCollection />
    </Content>
  )
}

export default SidebarFolder
