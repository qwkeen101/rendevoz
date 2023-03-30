import Icon from '@/components/base/Icon'
import SearchDialog from '@/components/dialogs/SearchDialog/SearchDialog'
import { motion } from 'framer-motion'
import { useState } from 'react'
import Modal from '../../base/Modal'
import styles from './index.module.less'
import { MenuItem } from './Item'
import { useTranslation } from 'react-i18next'
import SidebarCollection from './SidebarCollection'
import Content from '../../base/Content'
import { useTheme } from '@/hooks'
import { css } from '@emotion/css'
import SidebarPinned from './SidebarPinned'
import SidebarDatabase from './SidebarDatabase'
import SidebarSetting from './SidebarSetting'
import SidebarUser from './SidebarUser'
import Actions from '@/core/Actions'
import ClassName from '@/styles/classNames'
import { globalStore, ObjectStore } from '@/stores'

const variants = {
  open: {
    transition: { staggerChildren: 0.07, delayChildren: 0.2 }
  },
  closed: {
    transition: { staggerChildren: 0.05, staggerDirection: -1 }
  }
}
const Navigation = ({ hovered }: { hovered: boolean }) => {
  const [searchVisible, setSearchVisible] = useState(false)
  const { defaultFontColorGrey } = useTheme('defaultFontColorGrey', 'defaultFontColorBlack')
  const { t } = useTranslation()
  return (
    <>
      <Modal minWidth={600} minHeight={400} visible={searchVisible} onClose={() => setSearchVisible(false)}>
        <SearchDialog onSearchComplete={() => setSearchVisible(false)} />
      </Modal>
      <motion.ul
        className={styles.list}
        style={
          hovered
            ? {
                margin: 0
              }
            : undefined
        }
        variants={variants}
        onClick={() => {
        }}
      >
        <SidebarUser />
        <MenuItem onClick={Actions.openHome}>
          <Icon name="park-home" style={{ marginRight: 10 }} size={16} />
          {t('sidebar.home')}
        </MenuItem>
        <SidebarDatabase />
        <SidebarSetting />
        {/* <GlobalPocket>{urls => <SidebarPocket urls={urls} />}</GlobalPocket> */}
        <Content flex alignItems="center" style={{ padding: '0px 4px 0px 4px', marginTop: 20 }}>
          <div className={ClassName.description()}>{t('sidebar.pinned')}</div>
        </Content>
        <SidebarPinned />
        <Content flex column style={{ overflow: 'hidden', padding: 4, margin: -4, marginTop: 10 }}>
          <SidebarCollection />
        </Content>
      </motion.ul>
    </>
  )
}

export default Navigation
