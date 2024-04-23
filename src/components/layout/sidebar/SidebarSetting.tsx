import { Icon } from '@/components'
import Modal from '@/components/base/Modal'
import SettingDialog from '@/core/setting'
import { useToggle } from '@/hooks'
import { MenuItem } from './Item'

const SidebarSetting = () => {
  const [modalVisible, toggleModalVisible] = useToggle(false)
  return (
    <>
      <Modal enableClickEvent noStyle zIndex={1000} visible={modalVisible} onClose={toggleModalVisible}>
        <SettingDialog />
      </Modal>
      <MenuItem onClick={toggleModalVisible}>
        <Icon size={20} name="park-setting-two" />
      </MenuItem>
    </>
  )
}

export default SidebarSetting
