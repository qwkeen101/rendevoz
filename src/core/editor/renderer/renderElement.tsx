import { RenderElementProps } from 'slate-react'
import { Paragraph, Heading } from '../elements'
import Code from '../elements/Code'
import Emoji from '../elements/Emoji'
import HighlightBlock from '../elements/Highlight'
import MathElement from '../elements/Math'
import ListItem, { OrderListItem } from '../elements/listItem'
import MetaObject from '../elements/meta'
import InlineMetaElement from '../elements/meta/InlineMeta'
import TableCell from '../elements/table/Cell'
import TableRow from '../elements/table/Row'
import ToDo from '../elements/todo'
import Table from '../elements/table/Table'
import Image from '../elements/image'
import { css } from '@emotion/css'
import Colors from '@/consts/colors'
import Link from '../elements/Link'

const dividerClassName = css({
  width: '100%',
  height: '1px',
  borderBottom: `1px solid ${Colors.Background.Border}`
})

export const Element = (props: RenderElementProps) => {
  const { element, attributes, children } = props
  switch (element.type) {
    case 'paragraph':
      return <Paragraph {...props} />
    case 'block-quote':
      return <blockquote>{children}</blockquote>
    case 'bulleted-list':
      return <ul>{children}</ul>
    case 'order-list-item':
      return <OrderListItem {...props} />
    case 'math':
      return <MathElement {...props} />
    case 'link':
      return <Link {...props} />
    case 'figcaption':
      return <figcaption>{children}</figcaption>
    case 'pre':
      return <pre>{children}</pre>
    case 'table':
      return <Table {...props} />
    case 'tableCell':
      return <TableCell {...props} />
    case 'sup':
      return <sup {...attributes}>{children}</sup>
    case 'tableRow':
      return <TableRow {...props} />
    case 'code-block':
      return <Code {...props} />
    case 'divider':
      return (
        <div contentEditable={false} className={dividerClassName}>
          {children}
        </div>
      )
    case 'heading-one':
    case 'heading-two':
    case 'heading-three':
    case 'heading-four':
    case 'heading-five':
    case 'heading-six':
      return <Heading {...props} />
    case 'highlight-block':
      return <HighlightBlock {...props} />
    case 'metaObject':
      return <MetaObject {...props} />
    case 'image':
      return <Image {...props} />
    case 'to-do':
      return <ToDo {...props} />
    case 'list-item':
      return <ListItem {...props} />
    case 'inline-metaObject':
      return <InlineMetaElement {...props} />
    case 'emoji':
      return <Emoji {...props} />
    default:
      return <Paragraph {...props} />
  }
}
