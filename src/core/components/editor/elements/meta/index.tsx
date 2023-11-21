import { FC, memo, useState } from 'react'
import { RenderElementProps } from 'slate-react'
import { MetaObjectElement } from '~/typings'
import NoteCard from '../cards/NoteCard'
import { useRenderObject } from '@/core'
import { Content } from '@/components'
import { Colors } from '@/consts'
import FontSize from '@/consts/font'

const MetaObject: FC<RenderElementProps> = memo(({ children, element }) => {
  const metaEle = element as MetaObjectElement
  const { originId } = metaEle
  const { renderWhole, metaObject } = useRenderObject({
    metaObjectId: originId
  })
  const renderLineMain = () => (
    <Content
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
          padding: '8px 12px 8px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}
      >
        {renderWhole({
          optionOptions: {
            style: {
              top: -5,
              right: 0
            }
          },
          titleOptions: {
            showAddNote: false,
            style: {
              fontSize: 14
            }
          },
          descriptionOptions: {
            style: {
              fontSize: FontSize['12px']
            }
          },
          renderOptions: {
            renderFrom: true,
            renderImage: false,
            renderOption: true
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
