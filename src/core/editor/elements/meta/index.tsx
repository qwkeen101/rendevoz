import { FC, memo } from 'react'
import { RenderElementProps } from 'slate-react'
import { MetaObjectElement } from '~/typings'
import NoteCard from '../cards/NoteCard'
import { useRenderObject } from '@/core'
import { Content } from '@/components'
import { css } from '@emotion/css'

const MetaObject: FC<RenderElementProps> = memo(({ children, element }) => {
  const metaEle = element as MetaObjectElement
  const { originId } = metaEle
  const { renderWhole, metaObject } = useRenderObject({
    metaObjectId: originId
  })
  const renderMain = () => <div></div>
  const renderLineMain = () => (
    <Content
      className={css({
        img: {
          margin: 0
        }
      })}
    >
      {renderWhole({
        tagAboveImage: true,
        gap: 0,
        titleOptions: {
          style: {
            fontSize: 14
          }
        },
        descriptionOptions: {
          style: {
            fontSize: 13
          }
        },
        renderOptions: {
          renderFrom: true
        }
      })}
    </Content>
  )
  return (
    <NoteCard
      pictureUrl={metaObject?.coverImgSrc}
      // main={metaEle?.cardType === 'line' || metaEle?.cardType === undefined ? renderLineMain() : renderMain()}
      main={renderLineMain()}
      element={{ ...element, noteId: metaObject?.noteId }}
      children={children}
    />
  )
})

export default MetaObject
