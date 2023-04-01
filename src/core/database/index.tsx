import { useDebounceFn, useToggle } from '@/hooks'
import { pinnedMetaObjectsAtom, undeletedMetaObjectsAtom } from '@/stores/meta.store'
import { globalStore } from '@/stores'
import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import { Provider, useAtomValue, useSetAtom } from 'jotai/react'
import { createStore } from 'jotai/vanilla'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Flipper } from 'react-flip-toolkit'
import { MetaObject } from '~/typings/data'
import { Content, Icon } from '@/components'
import { DatabaseCard } from './card/DatabaseCard'
import { DatabaseFilter } from './filter'
import { FilterNameSearchAtom, useObjectFilter } from './filter/useObjectFilter'
import DatabaseListItem from './ListItem'

export const Database = () => {
  const undeletedMetaObjects = useAtomValue(undeletedMetaObjectsAtom, { store: globalStore })
  const pinnedMetaObjects = useAtomValue(pinnedMetaObjectsAtom, { store: globalStore })
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
  const DatabaseStore = useMemo(() => createStore(), [])
  const setSearch = useSetAtom(FilterNameSearchAtom, { store: DatabaseStore })
  useObjectFilter(ids => {
    const shouldDisplay = undeletedMetaObjects.filter(i => ids.has(i.id))
    setDisplayObjects(shouldDisplay)
  }, DatabaseStore)
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
            <div
              className={css({
                display: 'grid',
                gridGap: 35,
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                transition: 'all 0.2s ease',
                width: '100%',
                gridAutoFlow: 'dense'
              })}
            >
              {paginateObjects.map((i, idx) => (
                <DatabaseCard key={i.id} index={idx} metaObject={i} />
              ))}
            </div>
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
                  borderBottom: '1px solid rgba(0,0,0,0.05)'
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
              gap: 10
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
  return (
    <Provider store={DatabaseStore}>
      <Content flex column gap={16} className={css({ padding: 30, height: '100%' })}>
        <input
          placeholder="Search For Object"
          onChange={e => debouncedSetSearch(e.target.value)}
          className={css([ClassName.input(), { borderRadius: 999 }])}
        />
        <DatabaseFilter />
        <Content flex alignItems="center" justifyContent="space-between">
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
        <Content fullHeight style={{ margin: '0px -30px -30px' }}>
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
              overflowY: 'auto',
              padding: '0 30px'
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

export * from './filter'
export * from './card/DatabaseCard'
