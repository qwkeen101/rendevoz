import { useDebounceFn, useToggle } from '@/hooks'
import { pinnedMetaObjectsAtom, undeletedMetaObjectsAtom } from '@/stores/meta.store'
import { globalStore } from '@/stores/stores'
import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import { AnimatePresence } from 'framer-motion'
import fuzzysort from 'fuzzysort'
import { useAtomValue } from 'jotai/react'
import { useEffect, useState } from 'react'
import { Flipper } from 'react-flip-toolkit'
import { MetaObject } from '~/typings/data'
import { Content, Icon } from '../base'
import DatabaseCard from './card/DatabaseCard'

const KnowledgeDatabase = () => {
  const undeletedMetaObjects = useAtomValue(undeletedMetaObjectsAtom, { store: globalStore })
  const pinnedMetaObjects = useAtomValue(pinnedMetaObjectsAtom, { store: globalStore })
  const [paginateState, setPaginateState] = useState<{
    itemPerPage: number
    currentPage: number
  }>({
    itemPerPage: 20,
    currentPage: 0
  })
  const [search, setSearch] = useState('')

  const { run: debouncedSetSearch } = useDebounceFn(setSearch, { wait: 200 })

  const { currentPage, itemPerPage } = paginateState
  const paginateObjects = undeletedMetaObjects.slice(currentPage * itemPerPage, (currentPage + 1) * itemPerPage)

  const [displayObjects, setDisplayObjects] = useState<MetaObject[]>(paginateObjects)

  const [showPin, toggleShowPin] = useToggle(true)

  const [showAll, toggleShowAll] = useToggle(true)

  const hasNextPage = undeletedMetaObjects.length > (currentPage + 1) * itemPerPage
  useEffect(() => {
    if (!search) {
      setDisplayObjects(paginateObjects)
    } else {
      const results = fuzzysort.go(search, undeletedMetaObjects, { key: 'name' })
      setDisplayObjects(results.map(i => i.obj).slice(currentPage * itemPerPage, (currentPage + 1) * itemPerPage))
    }
  }, [undeletedMetaObjects, paginateState])
  useEffect(() => {
    if (search) {
      const results = fuzzysort.go(search, undeletedMetaObjects, { key: 'name' })
      setDisplayObjects(results.map(i => i.obj))
    } else {
      setDisplayObjects(paginateObjects)
    }
  }, [search])

  return (
    <Content flex column gap={16} className={css({ padding: 30, overflow: 'scroll', height: '100%' })}>
      <input
        placeholder="Search for meta object"
        onChange={e => debouncedSetSearch(e.target.value)}
        className={css([ClassName.input(), { borderRadius: 999 }])}
      />
      {pinnedMetaObjects.length > 0 && (
        <>
          <div
            onClick={toggleShowPin}
            className={css([ClassName.description(), ClassName.flatButton(4, '3px 6px'), { width: 'fit-content' }])}
          >
            Pinned
          </div>
          <Content
            className={css({
              display: `${showPin ? 'grid' : 'none'} !important`,
              gridGap: 35,
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              transition: 'all 0.2s ease'
            })}
          >
            <AnimatePresence>
              {pinnedMetaObjects.map((i, idx) => (
                <DatabaseCard key={i.id} index={idx} metaObject={i} />
              ))}
            </AnimatePresence>
          </Content>
        </>
      )}
      <Content flex alignItems="center" justifyContent="space-between">
        <div onClick={toggleShowAll} className={css([ClassName.description(), ClassName.flatButton(4, '3px 6px')])}>
          All
        </div>
        <Content className={ClassName.description()} flex alignItems="center" gap={20}>
          <div>Current Page : {currentPage + 1}</div>
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
      <Flipper spring="stiff" flipKey={`${displayObjects[displayObjects.length - 1]?.id}_${displayObjects.length}`}>
        <div
          className={css({
            display: `${showAll ? 'grid' : 'none'}`,
            gridGap: 35,
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            transition: 'all 0.2s ease',
            width: '100%',
            gridAutoFlow: 'dense'
          })}
        >
          {displayObjects.map((i, idx) => (
            <DatabaseCard key={i.id} index={idx} metaObject={i} />
          ))}
        </div>
      </Flipper>
    </Content>
  )
}

export default KnowledgeDatabase
