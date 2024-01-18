import { Icon } from '@/components'
import Modal from '@/components/base/Modal'
import SettingDialog from '@/core/setting'
import { useToggle } from '@/hooks'
import { useTranslation } from 'react-i18next'
import { MenuItem } from './Item'

const SidebarSetting = () => {
  const [modalVisible, toggleModalVisible] = useToggle(false)
  const { t } = useTranslation()
  return (
    <>
      <Modal noStyle zIndex={1000} visible={modalVisible} onClose={toggleModalVisible}>
        <SettingDialog onClose={toggleModalVisible} />
      </Modal>
      <MenuItem onClick={toggleModalVisible}>
        <Icon size={20} name="park-setting-two" />
        {/*{t("sidebar.setting")}*/}
      </MenuItem>
    </>
  )
}

export default SidebarSetting
