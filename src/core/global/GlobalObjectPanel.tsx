import { useMergedRef } from '@/hooks'
import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import React, { forwardRef, memo, useRef, useState } from 'react'
import { AnimatePopover, Button, Content, Icon, Tooltip, WithBorder, VirtualList, Image } from '@/components'
import { DraggableElement, ObjectActionPopover, useRenderObject } from '@/core'
import FontSize from '@/consts/font'
import { Rendevoz } from '../rendevoz'
export const SimpleObject = memo(
  forwardRef(
    (
      {
        metaObjectId,
        onNavigate
      }: {
        metaObjectId: number
        descriptionClassName?: string
        onNavigate?: VoidFunction
      },
      ref
    ) => {
      const containerRef = useRef<HTMLDivElement>(null)
      const mergedRef = useMergedRef(containerRef, ref)
      const { renderOptions, metaObject } = useRenderObject({
        metaObjectId: metaObjectId
      })
      const [popoveropen, setpopoveropen] = useState(false)
      if (!metaObject) return null
      return (
        <DraggableElement
          dragHandleClassName={titleClassName}
          ref={mergedRef}
          draggingDetails={{
            type: 'metaElement',
            metaId: metaObjectId
          }}
        >
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
            onContextMenu={() => setpopoveropen(true)}
            className={css([
              ClassName.flatButton(6, '6px'),
              {
                height: 32,
                '[role="icon"]': {
                  ':not([data-active="true"])': {
                    opacity: 0,
                    width: 0
                  }
                },
                ':hover': {
                  '[role="icon"]': {
                    opacity: 1,
                    width: 'auto'
                  }
                }
              }
            ])}
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
            <AnimatePopover
              onClickOutside={() => setpopoveropen(false)}
              visible={popoveropen}
              positions={['right', 'left']}
              align="start"
              padding={0}
              content={
                <WithBorder onClick={e => e.stopPropagation()}>
                  <ObjectActionPopover onClose={() => setpopoveropen(false)} metaObjectId={metaObjectId} />
                </WithBorder>
              }
            >
              <Icon
                onClick={e => {
                  setpopoveropen(true)
                  e.stopPropagation()
                }}
                containerStyle={{
                  zIndex: 10,
                  marginLeft: 'auto'
                }}
                size={20}
                name={'park-more'}
                className={ClassName.flatButton(4, '2px')}
              />
            </AnimatePopover>
          </Content>
        </DraggableElement>
      )
    }
  )
)

const titleClassName = css([ClassName.ellipsisFont(3), ClassName.title(FontSize['14px'])])
