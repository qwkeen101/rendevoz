import { MetaGroupChild } from '~/typings'
import { Button, Content } from '@/components'
import GalleryItemWrapper from '@/core/components/group/components/gallery/GalleryItemWrapper'
import { memo, useRef } from 'react'
import { useVirtualizer, Virtualizer } from '@tanstack/react-virtual'
import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
import { useSelectAtomValue } from '@/hooks'
import { GroupStateAtom } from '@/core/components/group/hooks/useGroupState'
import { useTranslation } from 'react-i18next'
import { isEqual } from 'lodash'

export default memo(
  ({
    values,
    grouperId,
    onVirtualizerInitialized,
    showAddMore: outShowAddMore
  }: {
    values: MetaGroupChild[]
    grouperId?: number
    showAddMore?: boolean
    onVirtualizerInitialized: (v: Virtualizer<any, any>) => void
  }) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const instance = useGroupInstance()
    const { t } = useTranslation()
    const {
      showAddMore = true,
      visibleProps,
      wrapContent = false,
      showOriginalText = false,
      showDeleted = false,
      showCover = 'cover',
      bottomPadding
    } = useSelectAtomValue(
      GroupStateAtom,
      s => ({
        showAddMore: s.layout?.showAddNew,
        visibleProps: s.visibleProperties,
        showOriginalText: s.showOriginalText,
        wrapContent: s.currentView?.options.wrapColumns,
        showDeleted: s.layout?.showDeletedMetas,
        showCover: s.currentView?.options.cardCover,
        bottomPadding: s.styles?.bottomPadding
      }),
      {
        compare: (prev, curr) => isEqual(prev, curr)
      }
    )
    const m = containerRef.current?.closest('[role="renderer-container"]')?.offsetTop ?? 0
    const virtualier = useVirtualizer({
      count: values.length,
      overscan: 3,
      estimateSize: () => 200,
      getScrollElement: () => instance.values.pageContainer,
      scrollMargin: m,
      paddingEnd: bottomPadding ?? 200
    })
    onVirtualizerInitialized?.(virtualier)
    const items = virtualier.getVirtualItems()
    return (
      <Content
        style={{ width: '100%', height: virtualier.getTotalSize(), marginBottom: showAddMore && outShowAddMore ? 28 : 0 }}
        ref={containerRef}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            transform: items.length ? `translateY(${(items[0].start ?? 0) - m}px)` : undefined
          }}
        >
          {items.map(i => (
            <GalleryItemWrapper
              style={{ padding: '4px 10px', fontSize: 14 }}
              showCover={showCover}
              showOriginalText={showOriginalText}
              hideCoverIfEmpty={true}
              visibleProps={visibleProps}
              wrapContent={wrapContent}
              showDeleted={showDeleted}
              dragPosition={'tb'}
              rowDetails={values[i.index]}
              key={values[i.index].rowId}
              ref={virtualier.measureElement}
              data-index={i.index}
            ></GalleryItemWrapper>
          ))}
          {items[items.length - 1]?.index === values.length - 1 && showAddMore && outShowAddMore && (
            <Button.IconButton
              onClick={() => {
                instance.metaOps?.createMeta(grouperId)
              }}
              style={{
                margin: '6px 10px 0px',
                padding: '4px 6px'
              }}
              className={'font-size-14 transparent-font'}
              text={t('general.New')}
              icon={'park-plus'}
            />
          )}
        </div>
      </Content>
    )
  }
)
