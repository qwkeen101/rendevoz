import { CustomElement, RegisterdEditorElement } from '~/typings'
import PluginApi from '../PluginApi'
import { Heading, Paragraph } from '@/core/editor/elements'
import ListItem, { OrderListItem } from '@/core/editor/elements/listItem'
import MathElement from '@/core/editor/elements/Math'
import Link from '@/core/editor/elements/Link'
import Table from '@/core/editor/elements/table/Table'
import TableCell from '@/core/editor/elements/table/Cell'
import TableRow from '@/core/editor/elements/table/Row'
import Code from '@/core/editor/elements/Code'
import { css } from '@emotion/css'
import Colors from '@/consts/colors'
import HighlightBlock from '@/core/editor/elements/Highlight'
import MetaObject from '@/core/editor/elements/meta'
import Image from '@/core/editor/elements/image'
import ToDo from '@/core/editor/elements/todo'
import InlineMetaElement from '@/core/editor/elements/meta/InlineMeta'
import Emoji from '@/core/editor/elements/Emoji'
import { t } from 'i18next'

const dividerClassName = css({
  width: '100%',
  height: '1px',
  borderBottom: `1px solid ${Colors.Background.Border}`
})

const BuiltinTypeToRegistered: Record<CustomElement['type'], RegisterdEditorElement> = {
  'inline-metaObject': {
    renderElement: props => <InlineMetaElement {...props} />,
    type: 'inline-metaObject',
    name: () => t('editor.inline metaobject'),
    registerInMenu: {
      icon: 'park-share-one',
      slashMenu: true,
      menuType: 'basic'
    }
  },
  paragraph: {
    renderElement: props => <Paragraph {...props} />,
    type: 'paragraph',
    registerInMenu: {
      slashMenu: true,
      addMenu: true,
      icon: 'park-font-size',
      menuType: 'basic',
      tooltip: 'Paragraph'
    },
    name: () => t('editor.paragraph')
  },
  'bulleted-list': {
    renderElement: props => <ul>{props.children}</ul>,
    type: 'bulleted-list'
  },
  math: {
    renderElement: props => <MathElement {...props} />,
    type: 'math',
    registerInMenu: {
      icon: 'park-formula',
      slashMenu: true,
      addMenu: true,
      tooltip: 'Math Formula',
      menuType: 'inline'
    },
    name: () => t('editor.math')
  },
  link: {
    renderElement: props => <Link {...props} />,
    type: 'link',
    name: () => t('editor.link')
  },
  figcaption: {
    renderElement: props => <figcaption>{props.children}</figcaption>,
    type: 'figcaption'
  },
  pre: {
    renderElement: props => <pre>{props.children}</pre>,
    type: 'pre'
  },
  table: {
    renderElement: props => <Table {...props} />,
    type: 'table',
    name: () => t('editor.table'),
    registerInMenu: {
      addMenu: true,
      slashMenu: true,
      menuType: 'block',
      icon: 'park-table-file'
    }
  },
  tableCell: {
    renderElement: props => <TableCell {...props} />,
    type: 'tableCell'
  },
  sup: {
    renderElement: props => <sup {...props.attributes}>{props.children}</sup>,
    type: 'sup'
  },
  tableRow: {
    renderElement: props => <TableRow {...props} />,
    type: 'tableRow'
  },
  'code-block': {
    renderElement: props => <Code {...props} />,
    type: 'code-block',
    registerInMenu: {
      addMenu: true,
      slashMenu: true,
      icon: 'park-code-brackets',
      tooltip: 'Code Editor',
      menuType: 'block'
    },
    name: () => t('editor.code-block')
  },
  divider: {
    renderElement: props => (
      <div contentEditable={false} className={dividerClassName}>
        {props.children}
      </div>
    ),
    type: 'divider'
  },
  'heading-one': {
    renderElement: props => <Heading {...props} />,
    type: 'heading-one',
    name: 'H1',
    registerInMenu: {
      addMenu: true,
      slashMenu: true,
      tooltip: 'H1',
      menuType: 'basic',
      icon: 'park-h1'
    }
  },
  'heading-two': {
    renderElement: props => <Heading {...props} />,
    type: 'heading-two',
    name: 'H2',
    registerInMenu: {
      addMenu: true,
      slashMenu: true,
      tooltip: 'H2',
      icon: 'park-h2',
      menuType: 'basic'
    }
  },
  'heading-three': {
    renderElement: props => <Heading {...props} />,
    type: 'heading-three',
    name: 'H3',
    registerInMenu: {
      addMenu: true,
      slashMenu: true,
      tooltip: 'H3',
      icon: 'park-h3',
      menuType: 'basic'
    }
  },
  'heading-four': {
    renderElement: props => <Heading {...props} />,
    type: 'heading-four',
    name: 'H4',
    registerInMenu: {
      addMenu: true,
      slashMenu: true,
      tooltip: 'H4',
      icon: 'park-level-four-title',
      menuType: 'basic'
    }
  },
  'heading-five': {
    renderElement: props => <Heading {...props} />,
    type: 'heading-five',
    name: 'H5'
  },
  'heading-six': {
    renderElement: props => <Heading {...props} />,
    type: 'heading-six',
    name: 'H6'
  },
  'block-quote': {
    renderElement: props => <blockquote>{props.children}</blockquote>,
    type: 'block-quote',
    registerInMenu: {
      slashMenu: true,
      addMenu: true,
      icon: 'park-quote',
      menuType: 'basic',
      tooltip: 'Blockquote'
    },
    name: () => t('editor.block-quote')
  },
  'order-list-item': {
    renderElement: props => <OrderListItem {...props} />,
    type: 'order-list-item',
    registerInMenu: {
      slashMenu: true,
      addMenu: true,
      icon: 'park-ordered-list',
      tooltip: 'Order List Item',
      menuType: 'basic'
    },
    name: () => t('editor.order-list-item')
  },
  'highlight-block': {
    renderElement: props => <HighlightBlock {...props} />,
    type: 'highlight-block',
    name: () => t('editor.highlight-block'),
    registerInMenu: {
      addMenu: true,
      slashMenu: true,
      menuType: 'block',
      tooltip: 'Highlight Block',
      icon: 'park-high-light'
    }
  },
  metaObject: {
    renderElement: props => <MetaObject {...props} />,
    type: 'metaObject',
    name: () => t('editor.metaObject')
  },
  image: {
    renderElement: props => <Image {...props} />,
    type: 'image',
    name: () => t('editor.image'),
    registerInMenu: {
      menuType: 'media',
      addMenu: true,
      slashMenu: true,
      icon: 'park-add-pic'
    }
  },
  'to-do': {
    renderElement: props => <ToDo {...props} />,
    type: 'to-do',
    name: () => t('editor.to-do'),
    registerInMenu: {
      addMenu: true,
      slashMenu: true,
      menuType: 'block',
      icon: 'park-check-correct'
    }
  },
  'list-item': {
    renderElement: props => <ListItem {...props} />,
    type: 'list-item',
    name: () => t('editor.list-item'),
    registerInMenu: {
      menuType: 'basic',
      slashMenu: true,
      addMenu: true,
      icon: 'park-list-one'
    }
  },
  emoji: {
    renderElement: props => <Emoji {...props} />,
    type: 'emoji',
    name: () => t('editor.emoji'),
    registerInMenu: {
      addMenu: true,
      slashMenu: true,
      menuType: 'inline',
      icon: 'park-emotion-happy'
    }
  }
}

const BuiltinEditorPlugin = (api: PluginApi) => {
  Object.values(BuiltinTypeToRegistered).forEach(item => api.register.registerEditorElement(item))
}

export default BuiltinEditorPlugin
