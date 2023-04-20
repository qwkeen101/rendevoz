import { useTranslation } from 'react-i18next'
import { useToggle } from '@/hooks'
import { Icon, Modal } from '@/components'
import { MenuItem } from './Item'
import { SearchDialog } from '@/core/search/SearchDialog'

const SidebarSearch = () => {
  const [modalVisible, toggleModalVisible] = useToggle(false)
  const { t } = useTranslation()
  return (
    <>
      <Modal noStyle visible={modalVisible} onClose={toggleModalVisible}>
        <SearchDialog onClose={toggleModalVisible} />
      </Modal>
      <MenuItem onClick={toggleModalVisible}>
        <Icon style={{ marginRight: 10 }} size={16} name="park-search" />
        {t('general.search')}
      </MenuItem>
    </>
  )
}

export default SidebarSearch
