import { memo, RefObject, useLayoutEffect, useMemo } from 'react'
import useHomeConfig from '@/scenes/home/useHomeConfig'
import { useTranslation } from 'react-i18next'
import { CheckBox, Icon } from '@/components'
import trans from '@/consts/trans'
import ContextMenu from '@/components/contextMenu'
import classnames from 'classnames'
import { compareStrings, DateFormat } from '@/utils'
import VirtualLoader from '@/core/components/common/VirtualLoader'
import { useUpdate } from 'react-use'
import { IHomeItem } from '@/scenes/home/useHomeItems'
import { EmptyList } from '@/core/components'

export default memo(
  ({
    scrollElementRef,
    selected,
    onSelect,
    isEditing,
    items
  }: {
    scrollElementRef: RefObject<HTMLDivElement>
    selected: Set<number>
    onSelect: (id: number) => void
    isEditing: boolean
    items: IHomeItem[]
  }) => {
    const { listSort, listColSize } = useHomeConfig()
    const { t } = useTranslation()
    const update = useUpdate()
    const sortedItems = useMemo(() => {
      const sorted = items.toSorted((a, b) => {
        if (a.type !== b.type) {
          if (a.type === 'collection') return -1
          if (b.type === 'collection') return 1
          return 0
        } else {
          switch (listSort) {
            case undefined:
            case 'nameDsc':
              return compareStrings(b.name, a.name)
            case 'nameAsc':
              return compareStrings(a.name, b.name)
            case 'createAsc':
              return a.createdAt - b.createdAt
            case 'createDesc':
              return b.createdAt - a.createdAt
            case 'viewAsc':
              return (a.viewAt == undefined ? Number.MAX_VALUE : a.viewAt) - (b.viewAt == undefined ? Number.MAX_VALUE : b.viewAt)
            case 'viewDesc':
              return (b.viewAt == undefined ? Number.MIN_VALUE : b.viewAt) - (a.viewAt == undefined ? Number.MIN_VALUE : a.viewAt)
          }
        }
      })
      return sorted
    }, [listSort, items])
    useLayoutEffect(() => {
      update()
    }, [])

    return (
      <>
        {!sortedItems.length ? (
          <EmptyList className={'flex-1'} />
        ) : (
          <VirtualLoader
            scrollElementRef={scrollElementRef}
            size={36}
            overscan={5}
            count={sortedItems.length}
            renderItem={idx => {
              const item = sortedItems[idx]
              if (item) {
                return (
                  <ContextMenu content={item.contextMenu}>
                    <div
                      data-id={item.id}
                      onClick={e => {
                        if (!e.defaultPrevented) {
                          if (isEditing) {
                            onSelect(item.id)
                          } else {
                            item.onClick()
                          }
                        }
                      }}
                      className={'button items-center !p-2 !pr-10 !rounded-lg flex'}
                    >
                      {isEditing && <CheckBox className={'ml-1 mr-3 !size-4'} checked={selected.has(item.id)} />}
                      <div className={'flex-1'}>
                        <div className={'flex items-center gap-4 min-h-9'}>
                          {item.image ? (
                            <img className={'rounded object-cover size-10 shrink-0'} src={item.image} />
                          ) : item.icon ? (
                            <Icon size={20} name={item.icon} className={'size-10 shrink-0'} />
                          ) : null}
                          <div className={classnames('line-clamp-1 pr-3', !item.name && 'super-transparent-font')}>
                            {item.name || t(trans.Unnamed)}
                          </div>
                        </div>
                      </div>
                      <div
                        style={{
                          width: listColSize?.view ?? 180
                        }}
                        className={'transparent-font font-size-12 shrink-0 px-4'}
                      >
                        {item.viewAt && DateFormat.formatDistanceToNowStrict(item.viewAt)}
                      </div>
                      <div
                        style={{
                          width: listColSize?.create ?? 180
                        }}
                        className={'transparent-font font-size-12 shrink-0 px-4'}
                      >
                        {DateFormat.formatDistanceToNowStrict(item.createdAt)}
                      </div>
                    </div>
                  </ContextMenu>
                )
              }
              return null
            }}
          ></VirtualLoader>
        )}
      </>
    )
  }
)
