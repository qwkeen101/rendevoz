import { MetaGroupChild } from '~/typings'
import { Button, Content } from '@/components'
import GalleryItemWrapper from '@/core/components/group/components/gallery/GalleryItemWrapper'
import { memo, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
import { useSelectAtomValue } from '@/hooks'
import { GroupStateAtom } from '@/core/components/group/hooks/useGroupState'
import { useTranslation } from 'react-i18next'

export default memo(
  ({ values, grouperId, showAddMore: outShowAddMore }: { values: MetaGroupChild[]; grouperId?: number; showAddMore?: boolean }) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const instance = useGroupInstance()
    const { t } = useTranslation()
    const showAddMore = useSelectAtomValue(GroupStateAtom, s => s.layout?.showAddNew) ?? true
    const visibleProps = useSelectAtomValue(GroupStateAtom, s => s.visibleProperties)
    const showOriginalText = useSelectAtomValue(GroupStateAtom, s => s.showOriginalText) ?? false
    const wrapContent = useSelectAtomValue(GroupStateAtom, s => s.currentView?.options.wrapColumns) ?? false
    const showDeleted = useSelectAtomValue(GroupStateAtom, s => s.layout?.showDeletedMetas) ?? false
    const showCover = useSelectAtomValue(GroupStateAtom, s => s.currentView?.options.cardCover) ?? 'cover'
    const m = containerRef.current?.closest('[role="renderer-container"]')?.offsetTop ?? 0
    const virtualier = useVirtualizer({
      count: values.length,
      overscan: 3,
      estimateSize: () => 200,
      getScrollElement: () => instance.values.pageContainer,
      scrollMargin: m,
      paddingEnd: 200
    })
    const items = virtualier.getVirtualItems()
    return (
      <Content style={{ width: '100%', height: virtualier.getTotalSize() }} ref={containerRef}>
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
