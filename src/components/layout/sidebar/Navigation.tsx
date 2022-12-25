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
import { useNavigate } from 'react-router-dom'
import { css } from '@emotion/css'
import NewCollectionForm from '@/components/form/NewCollectionForm'
import SidebarPinned from './SidebarPinned'
import EditMetaObjectForm from '@/components/form/EditMetaObjectForm'
import useMetaStore from '@/stores/meta.store'
import ClassName from '@/styles/classNames'

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
  const [newMetaVisible, setNewMetaVisible] = useState(false)
  const [newCollectionVisible, setNewCollectionVisible] = useState(false)
  const navigate = useNavigate()
  const { defaultFontColorGrey, defaultFontColorBlack } = useTheme('defaultFontColorGrey', 'defaultFontColorBlack')
  const { t } = useTranslation()
  const { addMetaObject } = useMetaStore()
  return (
    <>
      <Modal visible={newMetaVisible} onClose={() => setNewMetaVisible(false)} width={300}>
        <EditMetaObjectForm
          title="Create meta object"
          onUpdate={newMeta => {
            newMeta.type = 'knowledge'
            addMetaObject(newMeta)
            setNewMetaVisible(false)
          }}
        />
      </Modal>
      <Modal minWidth={600} minHeight={400} visible={searchVisible} onClose={() => setSearchVisible(false)}>
        <SearchDialog onSearchComplete={() => setSearchVisible(false)} />
      </Modal>
      <Modal minWidth={300} minHeight={200} visible={newCollectionVisible} onClose={() => setNewCollectionVisible(false)}>
        <NewCollectionForm onBack={() => setNewCollectionVisible(false)} />
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
        {/* <MenuItem to="/editor">
          <Icon name="park-editor" style={{ marginRight: 10 }} />
          {t('sidebar.editor')}
        </MenuItem> */}
        <MenuItem to="/database">
          <Icon name="park-data" style={{ marginRight: 10 }} size={16} />
          Database
          <Icon
            name="park-plus"
            onClick={e => {
              e.stopPropagation()
              setNewMetaVisible(true)
            }}
            containerClassName={css([{ marginLeft: 'auto' }, ClassName.circleButton(2, 4)])}
          />
        </MenuItem>
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
        <Content flex alignItems="center" justifyContent="space-between" style={{ padding: '0px 4px' }}>
          <div
            className={css({
              fontWeight: 600,
              fontSize: 13,
              userSelect: 'none',
              color: defaultFontColorGrey
            })}
          >
            {t('sidebar.collections')}
          </div>
          <Icon
            name="park-plus"
            size={14}
            fill={defaultFontColorGrey}
            onClick={() => {
              setNewCollectionVisible(true)
            }}
            className={css({
              cursor: 'pointer',
              padding: 2,
              borderRadius: 4,
              transition: 'all 0.2s ease',
              ':hover': {
                background: 'rgba(0,0,0,0.07)'
              }
            })}
          />
        </Content>
        <Content flex column>
          <SidebarCollection />
        </Content>
        {/* <MenuItem onClick={() => setSearchVisible(true)}>
          <Icon name="park-search" style={{ marginRight: 10 }} />
          {t('sidebar.search')}
        </MenuItem> */}
        {/* <MenuItem onClick={() => setNewItemVisible(true)}>
          <Icon name="park-plus" style={{ marginRight: 10 }} />
          {t('sidebar.new')}
        </MenuItem>
        <MenuItem onClick={() => setSettingVisible(true)}>
          <Icon name="park-setting-two" style={{ marginRight: 10 }} />
          {t('sidebar.setting')}
        </MenuItem> */}
      </motion.ul>
    </>
  )
}

export default Navigation
