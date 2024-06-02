import { Content } from '@/components'
import SidebarPinned from '@/components/layout/sidebar/SidebarPinned'
import SidebarCollection from '@/components/layout/sidebar/SidebarCollection'

const SidebarFolder = () => {
  return (
    <Content fullHeight flex column fullWidth style={{ overflowY: 'auto', paddingBottom: 100 }}>
      <SidebarPinned />
      <SidebarCollection />
    </Content>
  )
}

export default SidebarFolder
