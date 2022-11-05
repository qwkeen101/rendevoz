import { Noop } from '@/common/types'
import { useTheme } from '@/hooks'
import { css } from '@emotion/css'
import { FC, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Content, Icon } from '../base'
import SwitchAnimation from '../base/animation/SwitchAnimation'
import Menu from '../base/menu'
import NewDocumentDialog from './NewDocumentDialog'

const NewItemDialog: FC<{
  onNewDocument?: Noop
  onNewNoteClick?: Noop
}> = ({ onNewDocument, onNewNoteClick }) => {
  const [item, setItem] = useState<'document' | null>(null)
  const { t } = useTranslation()
  const nav = useNavigate()
  const renderChooseItemMenu = () => {
    return (
      <Menu>
        <Menu.Item type="button" icon={<Icon name="park-file-pdf-one" />} onClick={() => setItem('document')}>
          <Content flex column>
            <div className={css({ fontSize: 16, fontWeight: 600 })}>{t('dialog.pdf document')}</div>
            <div className={css({ fontSize: 13 })}>{t('dialog.import new pdf file')}</div>
          </Content>
        </Menu.Item>
        <Menu.Item
          type="button"
          icon={<Icon name="park-notes" />}
          onClick={() => {
            nav('/editor')
            onNewNoteClick?.()
            setItem(null)
          }}
        >
          <Content flex column>
            <div className={css({ fontSize: 16, fontWeight: 600 })}>{t('dialog.note')}</div>
            <div className={css({ fontSize: 13 })}>{t('dialog.open editor to write new note')}</div>
          </Content>
        </Menu.Item>
      </Menu>
    )
  }
  const renderItem = () => {
    switch (item) {
      case 'document':
        return <NewDocumentDialog onSubmit={onNewDocument} onBack={() => setItem(null)} />
    }
  }
  return (
    <Content style={{ width: 600, minHeight: 450 }}>
      <SwitchAnimation direction={!!item}>
        {switchWrapper => (item ? switchWrapper(renderItem(), 'item') : switchWrapper(renderChooseItemMenu(), 'menu'))}
      </SwitchAnimation>
    </Content>
  )
}

export default NewItemDialog
