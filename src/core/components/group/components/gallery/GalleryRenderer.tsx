import { memo, useRef } from 'react'
import { Content, Icon, useVirtualizer } from '@/components'
import { MetaGroupChild } from '~/typings'
import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
import { useSelectAtomValue } from '@/hooks'
import { GroupStateAtom } from '@/core/components/group/hooks/useGroupState'
import { useMeasure } from 'react-use'
import GalleryItemWrapper from '@/core/components/group/components/gallery/GalleryItemWrapper'
import { useTranslation } from 'react-i18next'
import { MetaStore } from '@/api/stores'
import { isEqual } from 'lodash'
import { assignProperties } from '@/utils'

const GalleryRenderer = memo(
  ({
    value = [],
    enableVirtualizer = true,
    grouperId,
    showAddMore: outShowAddMore
  }: {
    value?: MetaGroupChild[]
    enableVirtualizer?: boolean
    grouperId?: number
    showAddMore?: boolean
  }) => {
    const ref = useRef<HTMLDivElement>(null)
    const instance = useGroupInstance()
    const {
      visibleProps,
      showOriginalText = false,
      wrapContent = false,
      showAddMore = true,
      showDeleted = false,
      showCover = 'cover',
      cardSize,
      thumbnailMode,
      bottomPadding,
      hideCoverIfEmpty = false
    } = useSelectAtomValue(
      GroupStateAtom,
      s => ({
        visibleProps: s.visibleProperties,
        showOriginalText: s.showOriginalText,
        thumbnailMode: s.currentView?.options.thumbnailMode,
        wrapContent: s.currentView?.options.wrapColumns,
        showDeleted: s.layout?.showDeletedMetas,
        showAddMore: s.layout?.showAddNew,
        cardSize: s.currentView?.options.cardSize,
        showCover: s.currentView?.options.cardCover,
        bottomPadding: s.styles?.bottomPadding,
        hideCoverIfEmpty: s.currentView?.options.hideCoverIfEmpty
      }),
      {
        compare: (prev, curr) => isEqual(prev, curr)
      }
    )
    let size = 280
    switch (cardSize) {
      case 'small': {
        size = 220
        break
      }
      case 'medium': {
        size = 280
        break
      }
      case 'large': {
        size = 360
        break
      }
    }
    if (showDeleted === false) {
      const metaMap = MetaStore.getMetaObjectsMap()
      value = value.filter(i => metaMap.has(i.id) && !metaMap.get(i.id)?.deleted)
    }
    const { t } = useTranslation()
    if (enableVirtualizer) {
      instance.getScrollMargin = () => ref.current?.closest('[role="renderer-container"]')?.offsetTop ?? 0

      const m = instance.getScrollMargin?.() ?? 0
      const [measureRef, { width }] = useMeasure()
      const itemsPerRow = Math.floor(width / size) || 1
      const rows = Math.ceil((value.length + (showAddMore ? 1 : 0)) / itemsPerRow) || 0
      const virtualizer = useVirtualizer({
        overscan: 3,
        getScrollElement: () => instance.values.pageContainer,
        estimateSize: () => 300,
        count: rows,
        scrollMargin: m,
        paddingEnd: bottomPadding ?? 100
      })
      assignProperties(instance, {
        bodyOps: {
          ...instance.bodyOps,
          scrollToMeta: (metaId, select) => {
            console.log(value, metaId)
            const targetIdx = value.findIndex(i => i.id === metaId)
            if (targetIdx >= 0) {
              const rowIdx = Math.floor(targetIdx / itemsPerRow)
              virtualizer.scrollToIndex(rowIdx, {
                align: 'center'
              })
              if (select) {
                const row = value[targetIdx]
                instance.selectOps?.selectItem(row.tempRowId || row.rowId)
              }
            }
          }
        }
      })
      instance.virtualizer = virtualizer
      const items = virtualizer.getVirtualItems()

      const arr = Array.from(Array(itemsPerRow))
      return (
        <Content
          flex
          column
          style={{
            height: 0,
            flex: 1,
            padding: '0px max(calc(var(--page-padding-right) - 10px), 0px) 0px max(calc(var(--page-padding-right) - 10px), 0px)',
            width: '100%'
          }}
        >
          <Content ref={measureRef} role={'gallery-wrapper'} style={{ width: '100%', height: 'auto' }}>
            <Content
              flex
              column
              ref={ref}
              style={{
                width: '100%',
                fontSize: 14,
                height: 'auto'
              }}
            >
              <div
                style={{
                  height: value.length ? virtualizer.getTotalSize() : 0,
                  width: '100%',
                  position: 'relative',
                  flexShrink: 0
                }}
              >
                {width ? (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: items.length ? `translateY(${(items[0]?.start ?? 0) - m}px)` : undefined,
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    {items.map(i => {
                      const start = i.index * itemsPerRow
                      return (
                        <div
                          style={{
                            display: 'grid',
                            gap: 0,
                            gridTemplateColumns: `repeat(auto-fill, minmax(${size}px, 1fr))`
                          }}
                          key={i.index}
                          data-index={i.index}
                          ref={virtualizer.measureElement}
                        >
                          {arr.map((i, idx) => {
                            const v = value[start + idx]
                            if (v) {
                              return (
                                <GalleryItemWrapper
                                  thumbnailMode={thumbnailMode}
                                  showCover={showCover}
                                  showOriginalText={showOriginalText}
                                  hideCoverIfEmpty={hideCoverIfEmpty}
                                  visibleProps={visibleProps}
                                  wrapContent={wrapContent}
                                  rowDetails={v}
                                  showDeleted={showDeleted}
                                  key={v.rowId}
                                />
                              )
                            }
                          })}
                          {i.index === rows - 1 && showAddMore && (
                            <div style={{ width: '100%', height: '100%', padding: 10 }}>
                              <div
                                onClick={() => {
                                  instance.metaOps?.createMeta()
                                }}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  minHeight: 180,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 500,
                                  transition: 'background 0.15s ease'
                                }}
                                className={'bg-popover rounded-xl border-box-shadow light-hover transparent-font'}
                              >
                                <Content flex alignItems={'center'} gap={8}>
                                  <Icon name={'park-plus'} />
                                  {t('general.New')}
                                </Content>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : null}
              </div>
            </Content>
          </Content>
        </Content>
      )
    } else {
      return (
        <Content
          flex
          column
          style={{
            height: 'auto',
            flex: 1,
            padding: '0px max(calc(var(--page-padding-right) - 10px), 0px) 0px max(calc(var(--page-padding-right) - 10px), 0px)',
            width: '100%'
          }}
        >
          <div
            style={{
              display: 'grid',
              gap: 0,
              gridTemplateColumns: `repeat(auto-fill, minmax(${size}px, 1fr))`
            }}
          >
            {value.map(v => (
              <GalleryItemWrapper
                showCover={showCover}
                thumbnailMode={thumbnailMode}
                hideCoverIfEmpty={hideCoverIfEmpty}
                visibleProps={visibleProps}
                wrapContent={wrapContent}
                showDeleted={showDeleted}
                showOriginalText={showOriginalText}
                rowDetails={v}
                key={v.rowId}
              />
            ))}
            {outShowAddMore && showAddMore && (
              <div style={{ width: '100%', height: '100%', padding: 10 }}>
                <div
                  onClick={() => {
                    instance.metaOps?.createMeta(grouperId)
                  }}
                  style={{
                    width: '100%',
                    height: '100%',
                    minHeight: 180,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 500,
                    transition: 'background 0.15s ease'
                  }}
                  className={'bg-popover rounded-xl light-hover transparent-font border-box-shadow'}
                >
                  <Content flex alignItems={'center'} gap={8}>
                    <Icon name={'park-plus'} />
                    {t('general.New')}
                  </Content>
                </div>
              </div>
            )}
          </div>
        </Content>
      )
    }
  }
)

export default GalleryRenderer
