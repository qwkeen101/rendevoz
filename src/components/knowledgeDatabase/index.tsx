import { useDebounceFn, useToggle } from '@/hooks'
import { GlobalScope } from '@/jotai/jotaiScope'
import { pinnedMetaObjectsAtom, undeletedMetaObjectsAtom } from '@/stores/meta.store'
import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import { AnimatePresence } from 'framer-motion'
import fuzzysort from 'fuzzysort'
import { useAtomValue } from 'jotai'
import { useEffect, useState } from 'react'
import { MetaObject } from '~/typings/data'
import { Content } from '../base'
import DatabaseCard from './card/DatabaseCard'

const KnowledgeDatabase = () => {
  const undeletedMetaObjects = useAtomValue(undeletedMetaObjectsAtom, GlobalScope)
  const pinnedMetaObjects = useAtomValue(pinnedMetaObjectsAtom, GlobalScope)

  const [search, setSearch] = useState('')

  const [isLoading, setIsLoading] = useState(false)

  const { run: debouncedSetSearch } = useDebounceFn(setSearch, { wait: 200 })

  const km = undeletedMetaObjects.filter(i => i.type === 'knowledge')

  const [displayObjects, setDisplayObjects] = useState<MetaObject[]>(km)

  const [showPin, toggleShowPin] = useToggle(true)

  const [showAll, toggleShowAll] = useToggle(true)
  useEffect(() => {
    if (!search) {
      setDisplayObjects(km)
    } else {
      const results = fuzzysort.go(search, km, { key: 'name' })
      setDisplayObjects(results.map(i => i.obj))
    }
  }, [undeletedMetaObjects])
  useEffect(() => {
    setIsLoading(true)
    if (search) {
      const results = fuzzysort.go(search, km, { key: 'name' })
      setDisplayObjects(results.map(i => i.obj))
    } else {
      setDisplayObjects(km)
    }
    setTimeout(() => setIsLoading(false), 200)
  }, [search])
  const dm = undeletedMetaObjects.filter(i => i.type === 'document')
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
      <div onClick={toggleShowAll} className={css([ClassName.description(), ClassName.flatButton(4, '3px 6px'), { width: 'fit-content' }])}>
        All
      </div>
      <Content
        className={css({
          display: `${showAll ? 'grid' : 'none'} !important`,
          gridGap: 35,
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          transition: 'all 0.2s ease'
        })}
      >
        {!isLoading && (
          <AnimatePresence>
            {displayObjects.map((i, idx) => (
              <DatabaseCard key={i.id} index={idx} metaObject={i} />
            ))}
          </AnimatePresence>
        )}
      </Content>
    </Content>
  )
}

export default KnowledgeDatabase
