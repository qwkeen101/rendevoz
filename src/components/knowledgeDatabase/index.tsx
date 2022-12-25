import { useDebounceFn } from '@/hooks'
import { GlobalScope } from '@/jotai/jotaiScope'
import { undeletedMetaObjectsAtom } from '@/stores/meta.store'
import ClassName from '@/styles/classNames'
import { css } from '@emotion/css'
import { AnimatePresence, LayoutGroup } from 'framer-motion'
import fuzzysort from 'fuzzysort'
import { useAtom } from 'jotai'
import { useEffect, useState } from 'react'
import { useCounter } from 'react-use'
import { MetaObject } from '~/typings/data'
import { Content } from '../base'
import DatabaseCard from './card/DatabaseCard'

const KnowledgeDatabase = () => {
  const [undeletedMetaObjects] = useAtom(undeletedMetaObjectsAtom, GlobalScope)

  const [search, setSearch] = useState('')

  const [isLoading, setIsLoading] = useState(false)

  const { run: debouncedSetSearch } = useDebounceFn(setSearch, { wait: 200 })

  const km = undeletedMetaObjects.filter(i => i.type === 'knowledge')

  const [displayObjects, setDisplayObjects] = useState<MetaObject[]>(km)

  useEffect(() => {
    if (!search) {
      setDisplayObjects(km)
    } else {
      const results = fuzzysort.go(search, km, { key: 'keyword' })
      setDisplayObjects(results.map(i => i.obj))
    }
  }, [undeletedMetaObjects])
  useEffect(() => {
    setIsLoading(true)
    if (search) {
      const results = fuzzysort.go(search, km, { key: 'keyword' })
      setDisplayObjects(results.map(i => i.obj))
    } else {
      setDisplayObjects(km)
    }
    setTimeout(() => setIsLoading(false), 200)
  }, [search])
  const dm = undeletedMetaObjects.filter(i => i.type === 'document')
  return (
    <Content flex column gap={20} className={css({ padding: 30, overflow: 'scroll', height: '100%' })}>
      <input
        placeholder="Search for meta object"
        onChange={e => debouncedSetSearch(e.target.value)}
        className={css([ClassName.input(), { borderRadius: 999 }])}
      />
      <Content
        className={css({
          display: 'grid !important',
          gridGap: 35,
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))'
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
