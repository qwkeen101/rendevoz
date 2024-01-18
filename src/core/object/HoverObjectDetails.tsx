import { Tooltip, WithBorder } from '@/components'
import { useGlobalAtomValue, useMergedRef, useToggle, useUpdateEffect } from '@/hooks'

import { objectIdToMetaObjectIdMapAtom } from '@/api/stores/meta/meta.store'
import { cloneElement, forwardRef, memo, ReactElement, RefObject, useEffect, useRef, useState } from 'react'
import useRenderObject from './useRenderObject'
import FontSize from '@/consts/font'
import ClassName from '@/styles/classNames'
import { globalStore } from '@/api/stores'
import { Zindexes } from '@/consts'
import { Rendevoz } from '../rendevoz'
import { AnimatePopoverProps } from '@/components/base/AnimatePopover'

const HoverObjectDetails = forwardRef(
  (
    {
      objectId,
      metaObjectId,
      children,
      disable,
      parentElmentRef,
      positions,
      align
    }: {
      objectId?: number
      metaObjectId?: number
      children: ReactElement
      positions?: AnimatePopoverProps['positions']
      align?: AnimatePopoverProps['align']
      disable?: boolean
      parentElmentRef?: RefObject<HTMLElement>
    },
    ref
  ) => {
    const [metaId, setMetaId] = useState(metaObjectId || (objectId && globalStore.get(objectIdToMetaObjectIdMapAtom)?.get(objectId)))
    const [tooltipVisible, toggleTooltipVisible] = useToggle(false)
    if (objectId) {
      const objectIdToMetaMap = useGlobalAtomValue(objectIdToMetaObjectIdMapAtom)
      useUpdateEffect(() => {
        if (objectIdToMetaMap?.has(objectId)) {
          setMetaId(objectIdToMetaMap.get(objectId))
        } else {
          setMetaId(undefined)
        }
      }, [objectIdToMetaMap])
    }
    const childRef = useRef<Element>()
    const mergedRef = useMergedRef(childRef, ref)
    const { renderWhole, metaObject } = useRenderObject({
      metaObjectId: metaId || 0
    })
    useEffect(() => {
      if (disable) {
        const metaName = childRef.current?.querySelector("[role='meta-name']")
        if (metaName) {
          ;(metaName as HTMLElement).style.textDecoration = 'none'
          return () => {
            ;(metaName as HTMLElement).style.removeProperty('text-decoration')
          }
        }
      }
      if (tooltipVisible && !disable) {
        const metaName = childRef.current?.querySelector("[role='meta-name']")
        if (metaName) {
          ;(metaName as HTMLElement).style.textDecoration = 'underline'
          return () => {
            ;(metaName as HTMLElement).style.removeProperty('text-decoration')
          }
        }
      }
    }, [tooltipVisible, disable])
    if (!metaObject || metaObject.deleted)
      return cloneElement(children as JSX.Element, {
        ref
      })
    return (
      <Tooltip
        align={align}
        visible={tooltipVisible}
        disable={disable}
        parentElement={parentElmentRef?.current}
        onVisibleChange={v => toggleTooltipVisible(v)}
        ref={mergedRef}
        zIndex={Zindexes.HoverObjectDetails}
        delay={800}
        positions={positions}
        boundaryInset={30}
        disableDefaultContent
        contentTouchable
        content={
          <WithBorder style={{ maxWidth: 320, overflow: 'hidden', minWidth: 200 }}>
            {renderWhole({
              rowGap: 5,
              renderOptions: {
                renderFrom: true,
                renderOption: true,
                renderImage: true,
                imageMode: 'whole'
              },
              mainContainerStyle: {
                padding: '8px 10px'
              },
              optionOptions: {
                style: {
                  top: metaObject.coverImgSrc ? 2 : 5
                }
              },
              titleOptions: {
                showAddNote: false,
                style: {
                  fontSize: FontSize['13px']
                },
                onTitleClick: () => {
                  toggleTooltipVisible(false)
                  metaObject && Rendevoz.Actions.Open.Meta.openMetaObject(metaObject.id)
                }
              },
              descriptionOptions: {
                style: {
                  fontSize: FontSize['12px']
                }
              },
              fromOptions: {
                onFromClick: () => {
                  toggleTooltipVisible(false)
                }
              }
            })}
          </WithBorder>
        }
      >
        {children}
      </Tooltip>
    )
  }
)

export default memo(HoverObjectDetails)
