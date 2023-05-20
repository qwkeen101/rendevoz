import { css } from '@emotion/css'
import { FC, MouseEventHandler, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Content, Icon, Tooltip, Menu } from '@/components'
import { BasicElements, BlockElements, InlineElements, MediaElements } from '../consts/elements'
import FontSize from '@/consts/font'

type Element = {
  icon: string
  name: string
  tooltip: string
}
export const basic: Element[] = [
  {
    icon: 'park-font-size',
    name: BasicElements.Paragraph,
    tooltip: 'Paragraph'
  },
  {
    icon: 'park-h1',
    name: BasicElements.H1,
    tooltip: 'H1'
  },
  {
    icon: 'park-h2',
    name: BasicElements.H2,
    tooltip: 'H2'
  },
  {
    icon: 'park-h3',
    name: BasicElements.H3,
    tooltip: 'H3'
  },
  {
    icon: 'park-level-four-title',
    name: BasicElements.H4,
    tooltip: 'H4'
  },
  {
    icon: 'park-list-one',
    name: BasicElements.BulletedList,
    tooltip: 'Bullet list'
  },
  {
    icon: 'park-ordered-list',
    name: BasicElements.OrderedList,
    tooltip: 'Ordered List'
  },
  {
    icon: 'park-quote',
    name: BasicElements.Blockquote,
    tooltip: 'Blockquote'
  }
]
export const inline: Element[] = [
  {
    icon: 'park-emotion-happy',
    name: InlineElements.Emoji,
    tooltip: 'Emoji'
  },
  {
    icon: 'park-formula',
    name: InlineElements.Math,
    tooltip: 'Math'
  }
  // {
  //   icon: 'park-link',
  //   name: InlineElements.Link,
  //   tooltip: 'Link'
  // }
]
export const block: Element[] = [
  {
    icon: 'park-check-correct',
    name: BlockElements.ToDo,
    tooltip: 'To-do'
  },
  {
    icon: 'park-table-file',
    name: BlockElements.Table,
    tooltip: 'Table'
  }
]
export const media: Element[] = [
  {
    icon: 'park-add-pic',
    name: MediaElements.Image,
    tooltip: 'Image'
  }
  // {
  //   icon: 'park-video-file',
  //   name: MediaElements.Video,
  //   tooltip: 'Video'
  // },
  // {
  //   icon: 'park-audio-file',
  //   name: MediaElements.Audio,
  //   tooltip: 'Audio'
  // }
]
const EditorElementsMenu = (props: { onAddElement: (blockName: string) => void }) => {
  const { onAddElement } = props
  const { t } = useTranslation()
  return (
    <Content
      column
      flex
      className={css({
        padding: '12px 16px'
      })}
    >
      <Title>{t('editor.basic')}</Title>
      <Content
        className={css({
          gap: 10,
          display: 'grid !important',
          gridTemplateColumns: 'repeat(6,24px)',
          justifyContent: 'space-between'
        })}
      >
        {basic.map(b => (
          <IconItem key={b.name} onClick={() => onAddElement(b.name)} {...b} />
        ))}
      </Content>
      <Title>{t('editor.inline')}</Title>
      {inline.map(i => (
        <Item key={i.name} onClick={() => onAddElement(i.name)} {...i} />
      ))}
      <Title>{t('editor.block')}</Title>
      {block.map(i => (
        <Item key={i.name} onClick={() => onAddElement(i.name)} {...i} />
      ))}
      <Title>{t('editor.media')}</Title>
      {media.map(i => (
        <Item key={i.name} onClick={() => onAddElement(i.name)} {...i} />
      ))}
    </Content>
  )
}
type LayoutItem = Parameters<typeof Menu.NavigationMenu>[0]['layout'][0]
export const EditorSlashElementsMenu: typeof EditorElementsMenu = ({ onAddElement }) => {
  const { t } = useTranslation()
  return (
    <Menu.NavigationMenu
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: 6,
        maxHeight: 600,
        overflowY: 'auto',
        width: 200
      }}
      onClick={name => onAddElement(name)}
      layout={[
        {
          type: 'custom',
          children: <Title>{t('editor.basic')}</Title>
        },
        {
          type: 'item',
          icon: 'park-share-one',
          text: t('editor.inline metaobject'),
          name: 'inline-metaObject'
        },
        ...basic.map(
          b =>
            ({
              type: 'item',
              icon: b.icon,
              text: t(`editor.${b.name}`),
              name: b.name
            } as LayoutItem)
        ),
        {
          type: 'custom',
          children: <Title>{t('editor.inline')}</Title>
        },
        ...inline.map(
          i =>
            ({
              type: 'item',
              icon: i.icon,
              text: t(`editor.${i.name}`),
              name: i.name
            } as LayoutItem)
        ),
        {
          type: 'custom',
          children: <Title>{t('editor.block')}</Title>
        },
        ...block.map(
          i =>
            ({
              type: 'item',
              icon: i.icon,
              text: t(`editor.${i.name}`),
              name: i.name
            } as LayoutItem)
        ),
        {
          type: 'custom',
          children: <Title>{t('editor.media')}</Title>
        },
        ...media.map(
          i =>
            ({
              type: 'item',
              icon: i.icon,
              text: t(`editor.${i.name}`),
              name: i.name
            } as LayoutItem)
        )
      ]}
    />
  )
}
const Title = ({ children }: { children: ReactNode }) => {
  return (
    <div
      className={css({
        userSelect: 'none',
        fontSize: FontSize['13px'],
        fontWeight: 600,
        marginBottom: 8,
        ':not(:first-child)': {
          marginTop: 8
        }
      })}
    >
      {children}
    </div>
  )
}
const IconItem = ({
  name,
  icon,
  tooltip,
  onClick
}: {
  name?: string
  icon?: string
  tooltip?: string
  iconColor?: string
  onClick: MouseEventHandler
}) => {
  return (
    <Tooltip position="top" content={tooltip}>
      <Content
        onClick={onClick}
        className={css({
          borderRadius: 4,
          padding: 4,
          transition: 'all 0.2s ease',
          cursor: 'pointer',
          ':hover': {
            background: 'rgba(0,0,0,0.06)'
          }
        })}
      >
        <Icon name={icon} size={18} />
      </Content>
    </Tooltip>
  )
}
const Item = ({
  name,
  tooltip,
  icon,
  onClick
}: {
  name?: string
  icon?: string
  tooltip?: string
  iconColor?: string
  onClick?: MouseEventHandler
}) => {
  const { t } = useTranslation()
  return <Button.IconButton onClick={onClick} text={t(`editor.${name}`)} icon={icon} />
}
export default EditorElementsMenu
