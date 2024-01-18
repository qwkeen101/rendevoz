import { memo, useEffect, useRef } from 'react'
import { Content, Icon } from '@/components'
import { useVirtualizer } from '@tanstack/react-virtual'
import { MetaGroupChild } from '~/typings'
import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
import { GlobalInstance, useSelectAtomValue, useUpdateEffect } from '@/hooks'
import { GroupStateAtom } from '@/core/components/group/hooks/useGroupState'
import { useMeasure } from 'react-use'
import GalleryItemWrapper from '@/core/components/group/components/gallery/GalleryItemWrapper'
import { Colors } from '@/consts'
import { useTranslation } from 'react-i18next'
import { MetaStore } from '@/api/stores'
const GalleryRenderer = memo(({ value = [] }: { value?: MetaGroupChild[] }) => {
  const ref = useRef<HTMLDivElement>(null)
  const instance = useGroupInstance()
  const showDeleted = useSelectAtomValue(GroupStateAtom, s => s.layout?.showDeletedMetas) ?? false
  instance.getScrollMargin = () => ref.current?.closest('[role="renderer-container"]')?.offsetTop ?? 0
  const showAddMore = useSelectAtomValue(GroupStateAtom, s => s.layout?.showAddNew) ?? true
  const cardSize = useSelectAtomValue(GroupStateAtom, s => s.currentView?.options.cardSize)
  const m = instance.getScrollMargin?.() ?? 0
  const [measureRef, { width }] = useMeasure()
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
    value = value.filter(i => !metaMap.get(i.id)?.deleted)
  }
  const itemsPerRow = Math.floor(width / size) || 1
  const rows = Math.ceil((value.length + (showAddMore ? 1 : 0)) / itemsPerRow) || 0
  const virtualizer = useVirtualizer({
    overscan: 3,
    getScrollElement: () => instance.values.pageContainer,
    estimateSize: () => 300,
    count: rows,
    scrollMargin: m,
    paddingEnd: 200
  })

  const { t } = useTranslation()

  instance.virtualizer = virtualizer
  const items = virtualizer.getVirtualItems()

  const arr = Array.from(Array(itemsPerRow))
  return (
    <Content flex column style={{ height: 0, flex: 1, padding: '0px 50px 0px', width: '100%' }}>
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
                          return <GalleryItemWrapper rowDetails={v} key={v.rowId} />
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
                              borderRadius: 3,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 500,
                              transition: 'background 0.25s ease',
                              boxShadow: Colors.Background.BorderBoxShadow
                            }}
                            className={'bg-popover light-hover'}
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
})

export default GalleryRenderer
