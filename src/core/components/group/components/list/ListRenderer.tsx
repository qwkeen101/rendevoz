import { CSSProperties, memo } from 'react'
import { MetaGroupChild } from '~/typings'
import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
import { Button, Content, useVirtualizer } from '@/components'
import { useSelectAtomValue } from '@/hooks'
import { Colors } from '@/consts'
import ListItem from '@/core/components/group/components/list/ListItem'
import { GroupStateAtom } from '@/core/components/group/hooks/useGroupState'
import { useTranslation } from 'react-i18next'
import { assignProperties } from '@/utils'
export default memo(
  ({
    value = [],
    enableVirtualizer = true,
    grouperId,
    style,
    showAddMore: outShowAddMore
  }: {
    value?: MetaGroupChild[]
    enableVirtualizer?: boolean
    grouperId?: number
    showAddMore?: boolean
    style?: CSSProperties
  }) => {
    const instance = useGroupInstance()
    const m = instance.getScrollMargin?.() ?? 0
    const { t } = useTranslation()
    const showDeleted = useSelectAtomValue(GroupStateAtom, s => s.layout?.showDeletedMetas) ?? false
    const visibleProps = useSelectAtomValue(GroupStateAtom, s => s.visibleProperties)
    const showAddMore = useSelectAtomValue(GroupStateAtom, s => s.layout?.showAddNew) ?? true
    if (enableVirtualizer) {
      const virtualizer = useVirtualizer({
        overscan: enableVirtualizer ? 5 : value.length,
        getScrollElement: () => instance.values.pageContainer,
        estimateSize: () => 300,
        count: value.length,
        scrollMargin: enableVirtualizer ? m : 0,
        paddingEnd: enableVirtualizer ? 200 : 0
      })
      assignProperties(instance, {
        bodyOps: {
          ...instance.bodyOps,
          scrollToMeta: (metaId, select) => {
            const targetIdx = value.findIndex(i => i.id === metaId)
            if (targetIdx >= 0) {
              virtualizer.scrollToIndex(targetIdx, {
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
      const items = virtualizer.getVirtualItems()
      return (
        <Content
          flex
          column
          style={{ height: 0, flex: 1, padding: '0px var(--page-padding-right) 0px var(--page-padding-right)', width: '100%' }}
        >
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
                      <ListItem showDeleted={showDeleted} visibleProps={visibleProps} rowDetails={value[i.index]} />
                    </div>
                  ))}
                  {showAddMore && (
                    <Button.IconButton
                      text={t('general.New')}
                      icon={'park-plus'}
                      style={{
                        fontSize: 15,
                        fontWeight: 500,
                        color: Colors.Font.Transparent,
                        padding: '4px'
                      }}
                      onClick={() => {
                        instance.metaOps?.createMeta(grouperId)
                      }}
                    ></Button.IconButton>
                  )}
                </div>
              </div>
            </Content>
          </Content>
        </Content>
      )
    } else {
      return (
        <Content
          flex
          role={'list-wrapper'}
          column
          style={{ padding: '0px var(--page-padding-right) 0px var(--page-padding-right)', width: '100%', height: 'auto', ...style }}
        >
          {value.map(i => (
            <ListItem showDeleted={showDeleted} visibleProps={visibleProps} rowDetails={i} key={i.rowId} />
          ))}
          {showAddMore && outShowAddMore && (
            <Button.IconButton
              text={t('general.New')}
              icon={'park-plus'}
              style={{
                fontSize: 15,
                fontWeight: 500,
                color: Colors.Font.Transparent,
                padding: '4px'
              }}
              onClick={() => {
                instance.metaOps?.createMeta(grouperId)
              }}
            ></Button.IconButton>
          )}
        </Content>
      )
    }
  }
)
