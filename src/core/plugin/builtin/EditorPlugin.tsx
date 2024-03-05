import { CustomElement, RegisteredEditorElement } from '~/typings'
import PluginApi from '../PluginApi'
import { Heading, Paragraph } from '@/core/components/editor/elements'
import ListItem, { OrderListItem } from '@/core/components/editor/elements/listItem'
import MathElement from '@/core/components/editor/elements/math/Math'
import Link from '@/core/components/editor/elements/Link'
import Table from '@/core/components/editor/elements/table/Table'
import TableCell from '@/core/components/editor/elements/table/Cell'
import TableRow from '@/core/components/editor/elements/table/Row'
import Code from '@/core/components/editor/elements/Code'
import { css } from '@emotion/css'
import Colors from '@/consts/colors'
import HighlightBlock from '@/core/components/editor/elements/Highlight'
import MetaObject from '@/core/components/editor/elements/meta'
import Image from '@/core/components/editor/elements/image'
import ToDo from '@/core/components/editor/elements/todo'
import InlineMetaElement from '@/core/components/editor/elements/meta/InlineMeta'
import Emoji from '@/core/components/editor/elements/Emoji'
import { t } from 'i18next'
import InlineMetaPicker from '@/core/components/editor/elements/InlineMetaPicker'
import Synced from '@/core/components/editor/elements/synced'
import Embeded from '@/core/components/editor/elements/Embeded'
import MathBlock from '@/core/components/editor/elements/math/MathBlock'

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
  figcaption: {
    renderElement: props => (
      <figcaption
        style={{
          flexWrap: 'wrap',
          wordBreak: 'break-all'
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
  mathBlock: {
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
    type: 'sup'
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
    isVoid: true,
    name: () => t('editor.code-block')
  },
  divider: {
    renderElement: props => (
      <div contentEditable={false} style={{ width: '100%', padding: '10px 0px' }}>
        <div className={dividerClassName}>{props.children}</div>
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
  inlineMetapicker: {
    renderElement: props => <InlineMetaPicker {...props} />,
    type: 'inline-metapicker',
    isInline: true,
    isVoid: true
  }
}

const BuiltinEditorPlugin = (api: PluginApi) => {
  Object.values(BuiltinTypeToRegistered).forEach(item => api.register.registerEditorElement(item))
}

export default BuiltinEditorPlugin
