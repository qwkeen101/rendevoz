import { Tooltip, WithBorder } from '@/components'
import { useGlobalAtomValue, useToggle, useUpdateEffect } from '@/hooks'

import { objectIdToMetaObjectIdMapAtom } from '@/stores/meta.store'
import { ReactElement, cloneElement, forwardRef, memo, useState } from 'react'
import useRenderObject from './useRenderObject'
import FontSize from '@/consts/font'
import ClassName from '@/styles/classNames'
import { globalStore } from '@/stores'
import { Zindexes } from '@/consts'
import Actions from '../Actions'

const HoverObjectDetails = forwardRef(
  ({ objectId, metaObjectId, children }: { objectId?: number; metaObjectId?: number; children: ReactElement }, ref) => {
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

    const { renderWhole, metaObject } = useRenderObject({ metaObjectId: metaId || 0 })

    if (!metaObject || metaObject.deleted)
      return cloneElement(children as JSX.Element, {
        ref
      })
    return (
      <Tooltip
        visible={tooltipVisible}
        onVisibleChange={v => toggleTooltipVisible(v)}
        ref={node => {
          if (typeof ref === 'function') {
            ref(node)
          } else if (ref) {
            ref.current = node
          }
        }}
        zIndex={Zindexes.HoverObjectDetails}
        delay={800}
        disableDefaultContent
        contentTouchable
        content={
          <WithBorder style={{ maxWidth: 400, overflow: 'hidden' }}>
            {renderWhole({
              rowGap: 5,
              columnGap: 6,
              renderOptions: {
                renderFrom: true,
                renderOption: true,
                renderImage: true,
                imageMode: 'whole'
              },
              mainContainerStyle: {
                padding: 10
              },
              titleOptions: {
                style: {
                  fontSize: FontSize['14px']
                },
                onTitleClick: () => {
                  toggleTooltipVisible(false)
                  metaObject && Actions.navigateToTargetObject(metaObject.id)
                }
              },
              descriptionOptions: {
                style: {
                  fontSize: FontSize['12px']
                }
              },
              fromOptions: {
                style: {
                  fontSize: FontSize['11px']
                },
                onFromClick: () => {
                  toggleTooltipVisible(false)
                },
                className: ClassName.ellipsisFont(1)
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
