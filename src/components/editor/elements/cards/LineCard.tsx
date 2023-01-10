import { Content, Icon } from '@/components/base'
import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import { ReactNode, FC } from 'react'
import { CustomElement } from '../../types'

const LineCard: FC<{
  element?: CustomElement
  type?: 'note' | 'pdf'
  main?: ReactNode
  slateChildren?: ReactNode
}> = ({ main, slateChildren, type, element }) => {
  return (
    <Content
      contentEditable={false}
      flex
      alignItems="center"
      className={ClassName.flatButton(undefined, undefined, element?.background)}
      gap={10}
    >
      {type === 'note' && <Icon name="park-notes" size={20} />}
      {type === 'pdf' && <Icon name="park-book" size={20} />}
      {main}
      {slateChildren}
    </Content>
  )
}

export default LineCard
