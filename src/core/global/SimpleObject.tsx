import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import React, { forwardRef, memo } from 'react'
import { Content, Icon, WithBorder, Image } from '@/components'
import { DraggableElement, ObjectActionMenu, useRenderObject } from '@/core'
import { Rendevoz } from '../rendevoz'
import ContextMenu from '@/components/contextMenu'
import InnerContentDisplayer from '@/core/components/group/components/gallery/items/InnerContentDisplayer'
import { Colors } from '@/consts'
import usePreviewItem from '@/components/layout/sidebar/usePreviewItem'
export const SimpleObject = memo(
  forwardRef(
    (
      {
        metaObjectId,
        mode = 'thumbnail',
        preview
      }: {
        metaObjectId: number
        descriptionClassName?: string
        mode: 'thumbnail' | 'title'
        preview?: boolean
      },
      ref
    ) => {
      const { wrapper } = usePreviewItem(!!preview, metaObjectId, ref)
      const { metaObject } = useRenderObject({
        metaObjectId: metaObjectId
      })

      if (!metaObject) return null
      const renderContent = () => {
        if (mode === 'thumbnail') {
          return (
            <div
              onClick={e => {
                if (!e.defaultPrevented) {
                  Rendevoz.Actions.Open.Meta.openMetaObject(metaObjectId)
                }
              }}
              style={{
                flex: 1,
                overflow: 'hidden',
                padding: '2px 8px 10px',
                cursor: 'pointer',
                position: 'relative'
              }}
            >
              <InnerContentDisplayer
                className={css({
                  '*': {
                    pointerEvents: 'none'
                  },
                  ':hover': {
                    boxShadow: 'var(--box-shadow-secondary)'
                  }
                })}
                metaId={metaObjectId}
                containerStyle={{
                  transition: 'box-shadow 0.1s ease',
                  border: '1px solid var(--border-background)',
                  borderRadius: 6,
                  background: Colors.Background.Global,
                  overflow: 'hidden',
                  height: 208
                }}
              />
              {!metaObject.type.includes('Label') && (
                <Content
                  alignItems={'center'}
                  flex
                  gap={8}
                  style={{
                    maxWidth: 'calc(100% - 40px)',
                    position: 'absolute',
                    left: 16,
                    bottom: 16,
                    background: 'rgba(20, 20, 20, .85)',
                    color: 'white',
                    fontSize: 13,
                    padding: '4px 6px',
                    borderRadius: 4,
                    lineHeight: '18px'
                  }}
                >
                  <Icon name={Rendevoz.Utils.Object.getMetaObjectIcon(metaObject.type)} />
                  {metaObject.name && <div className={'ellipsis-font-1'}>{metaObject.name}</div>}
                </Content>
              )}
            </div>
          )
        }
        if (mode === 'title') {
          return (
            <Content
              onClick={e => {
                if (!e.defaultPrevented) {
                  Rendevoz.Actions.Open.Meta.openMetaObject(metaObjectId)
                }
              }}
              fullWidth
              flex
              alignItems={'center'}
              gap={10}
              style={{
                height: 32
              }}
              className={ClassName.flatButton(6, '6px')}
            >
              {metaObject.coverImgSrc ? (
                <Image src={metaObject.coverImgSrc} preview width={28} style={{ borderRadius: 6 }} />
              ) : (
                <Icon name={Rendevoz.Utils.Object.getMetaObjectIcon(metaObject.type)} size={16} />
              )}
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 500
                }}
                className={ClassName.ellipsisFont(1)}
              >
                {metaObject.name || metaObject.placeholderName}
              </div>
            </Content>
          )
        }
      }

      return wrapper(
        <ContextMenu
          content={setV => (
            <WithBorder onClick={e => e.stopPropagation()}>
              <ObjectActionMenu
                visibility={{
                  showContainsInSidebar: true
                }}
                onClose={() => setV(false)}
                metaObjectId={metaObjectId}
              />
            </WithBorder>
          )}
        >
          <DraggableElement
            draggingDetails={{
              type: 'metaElement',
              metaId: metaObjectId
            }}
          >
            {renderContent()!}
          </DraggableElement>
        </ContextMenu>
      )
    }
  )
)
