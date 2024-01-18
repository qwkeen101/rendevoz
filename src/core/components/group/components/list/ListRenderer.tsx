import { memo } from 'react'
import { MetaGroupChild } from '~/typings'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
import { Button, Content, Icon } from '@/components'
import GalleryItemWrapper from '@/core/components/group/components/gallery/GalleryItemWrapper'
import { GlobalInstance, useSelectAtomValue } from '@/hooks'
import { Colors } from '@/consts'
import ListItem from '@/core/components/group/components/list/ListItem'
import { GroupStateAtom } from '@/core/components/group/hooks/useGroupState'
import { ClassName } from 'rendevoz'
import { useTranslation } from 'react-i18next'
export default memo(({ value = [] }: { value?: MetaGroupChild[] }) => {
  const instance = useGroupInstance()
  const m = instance.getScrollMargin?.() ?? 0
  const { t } = useTranslation()
  const showAddMore = useSelectAtomValue(GroupStateAtom, s => s.layout?.showAddNew) ?? true
  const virtualizer = useVirtualizer({
    overscan: 5,
    getScrollElement: () => instance.values.pageContainer,
    estimateSize: () => 300,
    count: value.length,
    scrollMargin: m,
    paddingEnd: 200
  })
  const items = virtualizer.getVirtualItems()

  return (
    <Content flex column style={{ height: 0, flex: 1, padding: '0px 60px 0px', width: '100%' }}>
      <Content role={'list-wrapper'} style={{ width: '100%', height: 'auto' }}>
        <Content
          flex
          column
          style={{
            width: '100%',
            fontSize: 14,
            height: 'auto'
          }}
        >
          <div
            style={{
              minHeight: value.length ? virtualizer.getTotalSize() : 0,
              width: '100%',
              position: 'relative',
              flexShrink: 0
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: items.length ? `translateY(${(items[0]?.start ?? 0) - m}px)` : undefined
              }}
            >
              {items.map(i => (
                <div key={value[i.index].rowId} data-index={i.index} ref={virtualizer.measureElement}>
                  <ListItem rowDetails={value[i.index]} />
                </div>
              ))}
              {showAddMore && (
                <Button.IconButton
                  text={t('general.New')}
                  icon={'park-plus'}
                  className={ClassName.flatButton(3, '4px')}
                  style={{
                    fontSize: 15,
                    fontWeight: 500
                  }}
                  onClick={() => {
                    instance.metaOps?.createMeta()
                  }}
                ></Button.IconButton>
              )}
            </div>
          </div>
        </Content>
      </Content>
    </Content>
  )
})
