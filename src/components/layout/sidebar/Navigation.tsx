import Icon from '@/components/base/Icon'
import NewItemDialog from '@/components/dialogs/NewItemDialog'
import SearchDialog from '@/components/dialogs/SearchDialog/SearchDialog'
import { motion } from 'framer-motion'
import { useState } from 'react'
import Modal from '../../base/modal'
import styles from './index.module.less'
import { MenuItem } from './Item'
import { useTranslation } from 'react-i18next'
import SettingDialog from '@/components/dialogs/SettingDialog'
import SidebarCollection from './SidebarCollection'
import Content from '../../base/Content'
import { useTheme } from '@/hooks'
import { css } from '@emotion/css'
import NewCollectionForm from '@/components/form/NewCollectionForm'
import SidebarPinned from './SidebarPinned'
import GlobalPocket from '@/components/globalPocket'
import SidebarPocket from './SidebarPocket'
import SidebarDatabase from './SidebarDatabase'

const variants = {
  open: {
    transition: { staggerChildren: 0.07, delayChildren: 0.2 }
  },
  closed: {
    transition: { staggerChildren: 0.05, staggerDirection: -1 }
  }
}
const Navigation = () => {
  const [searchVisible, setSearchVisible] = useState(false)
  const [newItemVisible, setNewItemVisible] = useState(false)
  const [settingVisible, setSettingVisible] = useState(false)

  const { defaultFontColorGrey } = useTheme('defaultFontColorGrey', 'defaultFontColorBlack')
  const { t } = useTranslation()
  return (
    <>
      <Modal minWidth={600} minHeight={400} visible={searchVisible} onClose={() => setSearchVisible(false)}>
        <SearchDialog onSearchComplete={() => setSearchVisible(false)} />
      </Modal>
      <Modal visible={newItemVisible} onClose={() => setNewItemVisible(false)}>
        <NewItemDialog onNewDocument={() => setNewItemVisible(false)} onNewNoteClick={() => setNewItemVisible(false)} />
      </Modal>
      <Modal visible={settingVisible} onClose={() => setSettingVisible(false)}>
        <SettingDialog />
      </Modal>
      <motion.ul className={styles.list} variants={variants}>
        <MenuItem to="/home">
          <Icon name="park-home" style={{ marginRight: 10 }} size={16} />
          {t('sidebar.home')}
        </MenuItem>
        <SidebarDatabase />
        <GlobalPocket>{urls => <SidebarPocket urls={urls} />}</GlobalPocket>
        <Content flex alignItems="center" style={{ padding: '0px 4px' }}>
          <div
            className={css({
              fontWeight: 600,
              fontSize: 13,
              userSelect: 'none',
              color: defaultFontColorGrey
            })}
          >
            Pinned
          </div>
        </Content>
        <SidebarPinned />
        <Content flex column style={{ overflow: 'hidden', padding: 4, margin: -4 }}>
          <SidebarCollection />
        </Content>
      </motion.ul>
    </>
  )
}

export default Navigation
