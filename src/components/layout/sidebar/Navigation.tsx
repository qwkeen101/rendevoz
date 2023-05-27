import Icon from '@/components/base/Icon'
import { motion } from 'framer-motion'
import styles from './index.module.less'
import { MenuItem } from './Item'
import { useTranslation } from 'react-i18next'
import SidebarCollection from './SidebarCollection'
import Content from '../../base/Content'
import SidebarPinned from './SidebarPinned'
import SidebarDatabase from './SidebarDatabase'
import SidebarSetting from './SidebarSetting'
import SidebarUser from './SidebarUser'
import Actions from '@/core/Actions'
import SidebarSearch from './SidebarSearch'
import classNames from 'classnames'
import { css } from '@emotion/css'
import FontSize from '@/consts/font'

const variants = {
  open: {
    transition: { staggerChildren: 0.07, delayChildren: 0.2 }
  },
  closed: {
    transition: { staggerChildren: 0.05, staggerDirection: -1 }
  }
}
const Navigation = ({ hovered }: { hovered: boolean }) => {
  const { t } = useTranslation()
  return (
    <>
      <motion.ul
        className={classNames(
          styles.list,
          css({
            '*': {
              fontSize: FontSize['13px']
            }
          })
        )}
        style={
          hovered
            ? {
                margin: 0
              }
            : undefined
        }
        variants={variants}
      >
        <SidebarUser />
        <MenuItem onClick={Actions.openHome}>
          <Icon name="park-home" style={{ marginRight: 10 }} size={16} />
          {t('sidebar.home')}
        </MenuItem>
        <SidebarDatabase />
        <SidebarSearch />
        <SidebarSetting />
        {/* <GlobalPocket>{urls => <SidebarPocket urls={urls} />}</GlobalPocket> */}
        <Content
          flex
          column
          style={{ padding: '4px', overflowY: 'auto', overflowX: 'hidden', margin: '-4px -4px 0px', marginTop: 10, flex: 1 }}
        >
          <SidebarPinned />
          <SidebarCollection />
        </Content>
      </motion.ul>
    </>
  )
}

export default Navigation
