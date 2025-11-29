import { atom } from 'jotai/index'
import { useDebounceFn, useGlobalAtom, useUpdateEffect } from '@/hooks'
import { CSSProperties, useLayoutEffect, useRef } from 'react'
import classnames from 'classnames'
import { BetterInput, Icon } from '@/components'
import { Icons, KEY } from '@/consts'
import trans from '@/consts/trans'
import isHotkey from 'is-hotkey'
import { useTranslation } from 'react-i18next'
import fuzzysort from 'fuzzysort'

type ISearchable = Record<
  string,
  | {
      id: number
      searchable: string
    }[]
  | undefined
>
type ISearchableResults = Record<string, number[]>
export const LibrarySearchAtom = atom<
  Record<
    string,
    {
      results?: ISearchableResults
      query?: string
    }
  >
>({})

export default (cacheKey: string, searchable: ISearchable) => {
  const [cache, setCache] = useGlobalAtom(LibrarySearchAtom)
  const state = cache[cacheKey] ?? {}
  const calculateSearch = async () => {
    const query = state.query
    if (!query) {
      setCache(s => ({ ...s, [cacheKey]: { ...s[cacheKey], results: undefined } }))
      return
    }
    const result: ISearchableResults = {}
    Object.entries(searchable).forEach(([k, v]) => {
      if (!v) return
      const objs = fuzzysort.go(query, v, {
        key: 'searchable',
        threshold: -100000
      })
      result[k] = objs.map(i => i.obj.id)
    })
    setCache(s => ({ ...s, [cacheKey]: { ...s[cacheKey], results: result } }))
  }

  const debounceSearch = useDebounceFn(calculateSearch, { wait: 300 })

  useLayoutEffect(() => {
    calculateSearch()
  }, [state.query])

  useUpdateEffect(() => {
    debounceSearch.run()
  }, [state.query])

  const setSearch = (query?: string) => {
    setCache(s => ({ ...s, [cacheKey]: { ...s[cacheKey], query } }))
  }

  return {
    state,
    setSearch
  }
}
