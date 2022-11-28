import { Noop } from '@/common/types'
import { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { Content, Icon } from '../base'
import Menu from '../base/menu'

const EditorElementsMenu = (props: { onToggleEmoji: Noop; onAddSubPage: Noop; onAddMetaObject: Noop }) => {
  const { onToggleEmoji, onAddSubPage, onAddMetaObject } = props
  const { t } = useTranslation()
  return (
    <Menu>
      <Menu.Group title={t('editor.inline elements')}>
        <Menu.Item
          type="button"
          onClick={e => {
            e.stopPropagation()
            onToggleEmoji?.()
          }}
        >
          <IconWithDescription
            title="Emoji"
            description={t('editor.use emoji to express your ideas')}
            icon="park-message-emoji"
          ></IconWithDescription>
        </Menu.Item>
        {/* <Menu.Item type="button">
                      <IconWithDescription title="Link" description="Link to external pages" icon="park-link-one"></IconWithDescription>
                    </Menu.Item> */}
      </Menu.Group>
      <Menu.Group title={t('editor.block elements')}>
        <Menu.Item
          type="button"
          onClick={e => {
            e.stopPropagation()
            onAddSubPage?.()
          }}
        >
          <IconWithDescription
            title={t('editor.sub page')}
            description={t('editor.add sub page')}
            icon="park-doc-detail"
          ></IconWithDescription>
        </Menu.Item>
        <Menu.Item
          type="button"
          onClick={e => {
            e.stopPropagation()
            onAddMetaObject?.()
          }}
        >
          <IconWithDescription
            title={t('editor.meta object')}
            description={t('editor.use meta objects to organize your knowledge')}
            icon="park-share-one"
          ></IconWithDescription>
        </Menu.Item>
      </Menu.Group>
    </Menu>
  )
}
const IconWithDescription: FC<{
  icon: string
  title: string
  description?: string
}> = ({ icon, title, description }) => {
  return (
    <Content flex alignItems="center" fullWidth>
      <Content style={{ width: 40, height: 40, borderRadius: 7, marginRight: 10 }} flex centered>
        <Icon size={30} name={icon} />
      </Content>
      <Content auto flex column alignItems="center">
        <Content fullWidth style={{ fontSize: 16, fontWeight: 500 }}>
          {title}
        </Content>
        {description && (
          <Content fullWidth style={{ fontSize: 12 }}>
            {description}
          </Content>
        )}
      </Content>
    </Content>
  )
}

export default EditorElementsMenu
