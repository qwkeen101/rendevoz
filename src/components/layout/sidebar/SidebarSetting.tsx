import { Icon } from '@/components'
import Modal from '@/components/base/Modal'
import { useToggle } from '@/hooks'
import { MenuItem } from './Item'
import GlobalSetting from '@/core/setting'

const SidebarSetting = () => {
  const [modalVisible, toggleModalVisible] = useToggle(false)
  return (
    <>
      <Modal enableClickEvent noStyle zIndex={1000} visible={modalVisible} onClose={toggleModalVisible}>
        <GlobalSetting.SettingDialog />
      </Modal>
      <MenuItem onClick={toggleModalVisible}>
        <Icon size={20} name="park-setting-two" />
      </MenuItem>
    </>
  )
}

export default SidebarSetting
