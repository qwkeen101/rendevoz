import { CustomElement, RegisteredEditorElement } from '~/typings'
import { Heading, Paragraph } from '../elements/index'
import ListItem, { OrderListItem } from '../elements/listItem'
import MathElement from '../elements/math/Math'
import Link from '../elements/Link'
import Table from '../elements/table/Table'
import TableCell from '../elements/table/Cell'
import TableRow from '../elements/table/Row'
import Code from '../elements/Code'
import HighlightBlock from '../elements/Highlight'
import MetaObject from '../elements/meta'
import Image from '../elements/image'
import ToDo from '../elements/todo'
import InlineMetaElement from '../elements/meta/InlineMeta'
import Emoji from '../elements/Emoji'
import { t } from 'i18next'
import InlineMetaPicker from '../elements/InlineMetaPicker'
import Synced from '../elements/synced'
import Embeded from '../elements/Embeded'
import MathBlock from '../elements/math/MathBlock'
import Cloze from '../elements/Cloze'
import Select from '../elements/Select'
import InlineImage from '../elements/image/InlineImage'

export default {
  'inline-metaObject': {
    renderElement: props => <InlineMetaElement {...props} />,
    type: 'inline-metaObject',
    isInline: true,
    name: () => t('editor.inline metaobject'),
    registerInMenu: {
      icon: 'park-share-one',
      slashMenu: false,
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
    isInline: true,
    isVoid: true,
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
    name: () => t('editor.link'),
    registerInMenu: {
      icon: 'park-link',
      slashMenu: true,
      tooltip: 'Link',
      menuType: 'inline',
      addMenu: true
    },
    isInline: true
  },
  cloze: {
    isVoid: true,
    isInline: true,
    name: () => 'Cloze',
    type: 'cloze',
    renderElement: props => <Cloze {...props} />
  },
  figcaption: {
    renderElement: props => (
      <figcaption
        style={{
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
          '--placeholder': '"Type caption for image..."'
        }}
      >
        {props.children}
      </figcaption>
    ),
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
  synced: {
    type: 'synced',
    name: () => t('editor.synced'),
    renderElement: props => <Synced {...props} />,
    registerInMenu: {
      addMenu: true,
      slashMenu: true,
      menuType: 'block',
      icon: 'park-transfer-data'
    }
  },
  'math-block': {
    type: 'math-block',
    name: () => t('editor.math-block'),
    isVoid: true,
    renderElement: props => <MathBlock {...props} />,
    registerInMenu: {
      addMenu: true,
      slashMenu: true,
      menuType: 'block',
      icon: 'custom-equation'
    }
  },
  tableCell: {
    renderElement: props => <TableCell {...props} />,
    type: 'tableCell'
  },
  sup: {
    renderElement: props => <sup {...props.attributes}>{props.children}</sup>,
    type: 'sup',
    isInline: true
  },
  tableRow: {
    renderElement: props => <TableRow {...props} />,
    type: 'tableRow'
  },
  audio: {
    type: 'audio',
    isVoid: true,
    renderElement: props => (
      <audio
        style={{
          width: '100%',
          height: 40
        }}
        controls={true}
        src={props.element.url}
      >
        {props.children}
      </audio>
    )
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
      <div contentEditable={false} style={{ width: '100%', padding: '10px 0px' }}>
        <div className={'w-full border-bottom'}>{props.children}</div>
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
  embeded: {
    renderElement: props => <Embeded {...props} />,
    type: 'embeded',
    name: () => t('editor.embeded')
    // registerInMenu: {
    //   addMenu: true,
    //   slashMenu: true,
    //   menuType: 'block',
    //   icon: 'park-high-light'
    // }
  },
  metaObject: {
    renderElement: props => <MetaObject {...props} />,
    type: 'metaObject',
    name: () => t('editor.metaObject')
  },
  image: {
    renderElement: props => <Image {...props} />,
    type: 'image',
    isVoid: true,
    name: () => t('editor.image'),
    registerInMenu: {
      menuType: 'media',
      addMenu: true,
      slashMenu: true,
      icon: 'park-add-pic'
    }
  },
  iframe: {
    renderElement: props => <Embeded {...props} />,
    type: 'iframe',
    isVoid: true,
    name: () => t('editor.iframe'),
    registerInMenu: {
      addMenu: true,
      slashMenu: true,
      menuType: 'block',
      icon: 'park-web-page'
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
    isInline: true,
    isVoid: true,
    name: () => t('editor.emoji'),
    registerInMenu: {
      addMenu: true,
      slashMenu: true,
      menuType: 'inline',
      icon: 'park-emotion-happy'
    }
  },
  'inline-metapicker': {
    renderElement: props => <InlineMetaPicker {...props} />,
    type: 'inline-metapicker',
    isInline: true,
    isVoid: true
  },
  select: {
    renderElement: props => <Select {...props} />,
    type: 'select',
    isInline: true,
    isVoid: true
  },
  'inline-image': {
    isInline: true,
    isVoid: true,
    type: 'inline-image',
    renderElement: props => <InlineImage {...props} />
  }
} as Partial<Record<CustomElement['type'], RegisteredEditorElement>>
