import React, { forwardRef, memo, ReactElement } from 'react'
import { Icon, WithBorder, CheckBox } from '@/components'
import { DraggableElement, ObjectActionMenu } from '@/core'
import ContextMenu from '@/components/contextMenu'
import InnerContentDisplayer from '@/core/components/group/components/gallery/items/InnerContentDisplayer'
import usePreviewItem from '@/components/layout/sidebar/usePreviewItem'
import { useTranslation } from 'react-i18next'
import trans from '@/consts/trans'
import classnames from 'classnames'
import { DateFormat } from '@/utils'
import { MetaStore } from '@/api/stores'

export const SimpleObject = memo(
  forwardRef(
    (
      {
        metaObjectId,
        mode = 'thumbnail',
        preview,
        onSelect,
        isSelected,
        withDefaultPadding = true,
        onClick,
        bg = 'global',
        enableContextMenu = true,
        contextMenu,
        maxHeight,
        draggable = true,
        clickable = true
      }: {
        metaObjectId: number
        mode: 'thumbnail' | 'title'
        preview?: boolean
        onSelect?: VoidFunction
        isSelected?: boolean
        bg?: 'global' | 'secondary' | 'transparent'
        withDefaultPadding?: boolean
        onClick?: React.MouseEventHandler
        contextMenu?: (setV: (v: boolean) => void) => ReactElement
        enableContextMenu?: boolean
        maxHeight?: number
        draggable?: boolean
        clickable?: boolean
      },
      ref
    ) => {
      const { wrapper } = usePreviewItem(!!preview, metaObjectId, ref)
      const metaObject = MetaStore.useValue(metaObjectId)
      const { t } = useTranslation()

      if (!metaObject) return null
      const renderContent = () => {
        if (mode === 'thumbnail') {
          return (
            <div className={classnames('w-full overflow-hidden', withDefaultPadding && 'pl-2 pr-2 pb-3.5 pt-0.5 ')}>
              <div
                onClick={e => {
                  if (onSelect) {
                    onSelect()
                    return
                  }
                  if (!clickable) return
                  if (onClick) {
                    onClick(e)
                    return
                  }
                  if (!e.defaultPrevented) {
                    Global.layoutOps?.openObject(metaObjectId)
                  }
                }}
                className={classnames(
                  'rounded-xl w-full cursor-pointer',
                  bg === 'global' ? 'bg-global' : bg === 'secondary' ? 'bg-popover' : undefined
                )}
              >
                <div
                  style={{
                    aspectRatio: '4 / 3',
                    maxHeight
                  }}
                  className={classnames(
                    'flex flex-col rounded-xl overflow-hidden w-full light-hover border transition-colors',
                    isSelected && 'select-color-border select-color-super-transparent-bg'
                  )}
                >
                  <InnerContentDisplayer className={'disable-all-pointer-events flex-1 overflow-hidden'} metaId={metaObjectId} />
                  {!metaObject.type.includes('Label') && (
                    <div className={classnames('border-top px-3 py-2 shrink-0 gap-2')}>
                      <div
                        className={classnames(
                          'line-clamp-1 break-all',
                          !metaObject.name ? 'super-transparent-font' : 'primary-font'
                        )}
                      >
                        {metaObject.name || t(trans.Unnamed)}
                      </div>
                      <div className={'font-size-12 mt-0.5 transparent-font'}>
                        {Global.utils.getTypeName(metaObject.type)} · {DateFormat.formatDate(metaObject.createdAt)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        }
        if (mode === 'title') {
          const name = metaObject.type.includes('Label') ? metaObject.name || metaObject.placeholderName : metaObject.name
          return (
            <div
              onClick={e => {
                if (onSelect) {
                  onSelect()
                  return
                }
                if (!clickable) return
                if (onClick) {
                  onClick(e)
                  return
                }
                if (!e.defaultPrevented) {
                  Global.layoutOps?.openObject(metaObjectId)
                }
              }}
              className={'button w-full items-center flex gap-2.5 font-size-13 !h-10'}
            >
              {onSelect && <CheckBox className={'mr-2'} checked={!!isSelected} />}
              {metaObject.coverImgSrc ? (
                <img src={metaObject.coverImgSrc} className={'rounded size-7 object-cover'} />
              ) : (
                <Icon name={Global.utils.getIcon(metaObject.type)} size={16} />
              )}
              <div className={classnames('line-clamp-1 break-all', !name && 'super-transparent-font')}>{name || t(trans.Unnamed)}</div>
            </div>
          )
        }
      }
      const renderInner = () => {
        return draggable ? (
          <DraggableElement
            draggingDetails={{
              type: 'metaObjects',
              ids: [metaObjectId]
            }}
          >
            {renderContent()!}
          </DraggableElement>
        ) : (
          renderContent()!
        )
      }
      return wrapper(
        enableContextMenu ? (
          <ContextMenu
            content={setV =>
              contextMenu ? (
                contextMenu(setV)
              ) : (
                <WithBorder onClick={e => e.stopPropagation()}>
                  <ObjectActionMenu
                    visibility={{
                      showContainsInSidebar: true
                    }}
                    onClose={() => setV(false)}
                    metaObjectId={metaObjectId}
                  />
                </WithBorder>
              )
            }
          >
            {renderInner()}
          </ContextMenu>
        ) : (
          renderInner()
        )
      )
    }
  )
)
