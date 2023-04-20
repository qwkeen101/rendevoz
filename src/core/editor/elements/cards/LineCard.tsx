import { Content, Icon } from '@/components/base'
import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import { ReactNode, FC } from 'react'
import { CustomElement } from '~/typings'

const IconClassName = css({
  color: 'rgba(var(--font-bg, 55 53 47 / 85%)) !important'
})
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
      data-meta-id={element.id}
      className={ClassName.flatButton(undefined, undefined, element?.background)}
      gap={10}
    >
      {type === 'note' && <Icon className={IconClassName} name="park-notes" size={20} />}
      {type === 'pdf' && <Icon className={IconClassName} name="park-book" size={20} />}
      {type === 'meta' && <Icon className={IconClassName} name="park-share-one" size={20}/>}
      {main}
      {slateChildren}
    </Content>
  )
}

export default LineCard
