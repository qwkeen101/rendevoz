import { FC, memo, useState } from 'react'
import { RenderElementProps } from 'slate-react'
import { MetaObjectElement } from '~/typings'
import NoteCard from '../cards/NoteCard'
import { useRenderObject } from '@/core'
import { Content } from '@/components'
import { Colors } from '@/consts'

const MetaObject: FC<RenderElementProps> = memo(({ children, element }) => {
  const metaEle = element as MetaObjectElement
  const { originId } = metaEle
  const { renderWhole, metaObject } = useRenderObject({
    metaObjectId: originId
  })
  const [mouseIn, setMouseIn] = useState(false)
  const renderMain = () => <div></div>
  const renderLineMain = () => (
    <Content
      onPointerMove={() => {
        setMouseIn(true)
      }}
      onPointerLeave={() => {
        setMouseIn(false)
      }}
      flex
      style={{
        flexWrap: 'wrap-reverse',
        width: '100%',
        borderRadius: 6,
        alignItems: 'stretch',
        overflow: 'hidden',
        border: `1px solid ${Colors.Background.Border}`,
        minHeight: 80
      }}
    >
      <div
        style={{
          flex: '4 1 180px',
          overflow: 'hidden',
          padding: '12px 14px 12px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}
      >
        {renderWhole({
          columnGap: 3,
          optionOptions: {
            style: {
              top: -5,
              right: 0
            }
          },
          renderOptions: {
            renderFrom: true,
            renderImage: false,
            renderOption: mouseIn ? true : false
          }
        })}
      </div>
      {metaObject?.coverImgSrc && (
        <div
          style={{
            flex: '1 1 180px',
            position: 'relative'
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0
            }}
          >
            <img
              style={{
                objectFit: 'cover',
                borderRadius: 1,
                width: '100%',
                height: '100%'
              }}
              src={metaObject.coverImgSrc}
            />
          </div>
        </div>
      )}
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
