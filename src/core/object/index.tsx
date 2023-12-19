import { useDebounceFn, useToggle } from '@/hooks'
import { relatedMetaObjectsMapAtom, undeletedMetaObjectsAtom } from '@/api/stores/meta.store'
import { globalStore } from '@/api/stores'
import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import { Provider, useAtomValue } from 'jotai/react'
import { useEffect, useRef, useState } from 'react'
import { Flipper } from 'react-flip-toolkit'
import { MetaObject } from '~/typings/data'
import { Content, Icon } from '@/components'
import { DatabaseCard } from './card/DatabaseCard'
import DatabaseListItem from './ListItem'
import Select from '@/components/base/select'
import { useTranslation } from 'react-i18next'
import Colors from '@/consts/colors'
import Masonry from '@/components/base/Masonry'

export const Database = () => {
  const undeletedMetaObjects = useAtomValue(undeletedMetaObjectsAtom, {
    store: globalStore
  })
  const [paginateState, setPaginateState] = useState<{
    itemPerPage: number
    currentPage: number
  }>({
    itemPerPage: 20,
    currentPage: 0
  })
  const [databaseState, setDatabaseState] = useState<{
    renderMode: 'detail card' | 'detail list' | 'title list'
  }>({
    renderMode: 'detail card'
  })

  const [sortMode, setSortMode] = useState<'new create' | 'old create' | 'new view' | 'old view' | 'most related'>('new create')

  useEffect(() => {
    const relatedMap = globalStore.get(relatedMetaObjectsMapAtom)
    const getSortMethod = (): ((a: MetaObject, b: MetaObject) => number) => {
      switch (sortMode) {
        case 'old create':
          return (a, b) => a.createdAt - b.createdAt
        case 'old view':
          return (a, b) => (a.viewAt || 0) - (b.viewAt || 0)
        case 'new create':
          return (a, b) => b.createdAt - a.createdAt
        case 'new view':
          return (a, b) => (b.viewAt || 0) - (a.viewAt || 0)
        case 'most related':
          return (a, b) => {
            const aRelated = relatedMap.get(a.id)?.size || 0
            const bRelated = relatedMap.get(b.id)?.size || 0

            return bRelated - aRelated
          }
        default:
          return (a, b) => a.createdAt - b.createdAt
      }
    }
    const sort = getSortMethod()
    setDisplayObjects(s => {
      s.sort(sort)
      return [...s]
    })
  }, [sortMode])

  const { run: debouncedSetSearch } = useDebounceFn(setSearch, { wait: 200 })

  const { currentPage, itemPerPage } = paginateState

  const [displayObjects, setDisplayObjects] = useState<MetaObject[]>(undeletedMetaObjects)

  const paginateObjects = displayObjects.slice(currentPage * itemPerPage, (currentPage + 1) * itemPerPage)

  const hasNextPage = displayObjects.length > (currentPage + 1) * itemPerPage

  const renderItems = () => {
    switch (databaseState?.renderMode) {
      case 'detail card':
        return (
          <Flipper spring="stiff" flipKey={`${displayObjects[displayObjects.length - 1]?.id}_${displayObjects.length}`}>
            <Masonry
              gap={35}
              breakPoints={{
                350: 1,
                750: 2,
                1000: 3,
                1300: 4,
                1700: 5,
                2100: 6,
                2400: 7,
                2800: 8
              }}
            >
              {paginateObjects.map((i, idx) => (
                <DatabaseCard key={i.id} index={idx} metaObject={i} />
              ))}
            </Masonry>
          </Flipper>
        )
      case 'detail list':
        return (
          <div
            className={css({
              display: 'flex',
              flexDirection: 'column',
              transition: 'all 0.2s ease',
              width: '100%',
              gap: 16,
              '> div': {
                paddingBottom: '8px',
                ':not(:last-child)': {
                  borderBottom: `1px solid ${Colors.Background.Border}`
                }
              }
            })}
          >
            {paginateObjects.map(i => (
              <DatabaseListItem id={i.id} key={i.id} mode="all" />
            ))}
          </div>
        )
      case 'title list':
        return (
          <div
            className={css({
              display: 'flex',
              flexDirection: 'column',
              transition: 'all 0.2s ease',
              width: '100%',
              gap: 16,
              '> div': {
                paddingBottom: '8px',
                ':not(:last-child)': {
                  borderBottom: '1px solid rgba(0,0,0,0.05)'
                }
              }
            })}
          >
            {paginateObjects.map(i => (
              <DatabaseListItem id={i.id} key={i.id} mode="title" />
            ))}
          </div>
        )
    }
  }
  const overflowContainerRef = useRef<HTMLDivElement>(null)

  const [showBoxShadow, toggleShowBoxShadow] = useToggle(false)

  useEffect(() => {
    const scrollHandler = e => {
      if (overflowContainerRef.current?.scrollTop) {
        toggleShowBoxShadow(true)
      } else {
        toggleShowBoxShadow(false)
      }
    }
    overflowContainerRef.current?.addEventListener('scroll', scrollHandler)
    return () => {
      overflowContainerRef.current?.removeEventListener('scroll', scrollHandler)
    }
  }, [])

  const { t } = useTranslation()
  return (
    <Provider store={DatabaseStore}>
      <Content flex column gap={16} className={css({ padding: 30, height: '100%' })}>
        <input
          placeholder={t('database.search for object', {
            object: t('general.object')
          })}
          onChange={e => debouncedSetSearch(e.target.value)}
          className={css([ClassName.input(), { borderRadius: 8 }])}
        />
        <Content flex alignItems="center" justifyContent="space-between">
          <Content className={ClassName.description()} flex alignItems="center" gap={30}>
            <Select
              value={databaseState.renderMode}
              closeOnSelect
              onSelect={v => {
                setDatabaseState({
                  renderMode: v[0] as (typeof databaseState)['renderMode']
                })
              }}
              options={[
                {
                  value: 'detail card',
                  children: t('database.detail card')
                },
                {
                  value: 'detail list',
                  children: t('database.detail list')
                },
                {
                  value: 'title list',
                  children: t('database.title list')
                }
              ]}
            ></Select>
            <Select
              value={sortMode}
              closeOnSelect
              onSelect={v => {
                setSortMode(v[0] as typeof sortMode)
              }}
              options={[
                {
                  value: 'new create',
                  children: t('database.recent create')
                },
                {
                  value: 'old create',
                  children: t('database.earliest create')
                },
                {
                  value: 'new view',
                  children: t('database.recent view')
                },
                {
                  value: 'old view',
                  children: t('database.earliest view')
                },
                {
                  value: 'most related',
                  children: t('database.most related')
                }
              ]}
            ></Select>
          </Content>
          <Content className={ClassName.description()} flex alignItems="center" gap={20}>
            <Icon
              className={ClassName.circleButton()}
              size={20}
              name="park-left"
              style={{ cursor: currentPage === 0 ? 'not-allowed' : 'pointer' }}
              onClick={() => {
                if (currentPage > 0) {
                  setPaginateState({
                    ...paginateState,
                    currentPage: paginateState.currentPage - 1
                  })
                }
              }}
            />
            {`${currentPage + 1} / ${Math.floor(displayObjects.length / itemPerPage) + 1}`}
            <Icon
              className={ClassName.circleButton()}
              size={20}
              name="park-right"
              onClick={() => {
                if (hasNextPage) {
                  setPaginateState({
                    ...paginateState,
                    currentPage: paginateState.currentPage + 1
                  })
                }
              }}
              style={{ cursor: hasNextPage ? 'pointer' : 'not-allowed' }}
            />
          </Content>
        </Content>
        <Content style={{ margin: '0px -30px -30px', height: 0, flexGrow: 1 }}>
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 100,
              boxShadow: showBoxShadow ? 'rgb(55 53 47 / 9%) 0px 20px 10px -10px inset' : undefined,
              transition: 'box-shadow 0.3s ease',
              zIndex: 10,
              pointerEvents: 'none'
            }}
          ></div>

          <Content
            ref={overflowContainerRef}
            style={{
              height: '100%',
              width: '100%',
              overflowY: 'auto',
              padding: '0 30px 50px'
            }}
          >
            {renderItems()}
          </Content>
        </Content>
      </Content>
    </Provider>
  )
}

export { default as useRenderObject } from './useRenderObject'

export * from './card/DatabaseCard'
export { default as useDropObjectArea } from './useDropObjectArea'
export { default as AttachmentObject } from './AttachmentObject'
export { default as AttachmentList } from './AttachmentList'
export { default as AttachmentWrapper } from './AttachmentWrapper'
export { default as useRenderLabel } from './useRenderLabel'
export * from './ObjectTimeline'
export { default as IconNameRenderer } from './IconNameRenderer'
export const intersectionOfMultipleSets = (set1: Set<number>, set2: Set<number>) => {
  const ans = new Set()
  for (let i of set2) {
    if (set1.has(i)) {
      ans.add(i)
    }
  }
  return ans
}
