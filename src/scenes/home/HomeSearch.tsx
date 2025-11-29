import React, { memo, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { BetterInput, Icon } from '@/components'
import { Icons } from '@/consts'
import { useDebounceEffect } from '@/hooks'
import { CollectionStore, MetaStore } from '@/api/stores'
import fuzzysort from 'fuzzysort'
import { IHomeSearchResults } from '@/scenes/HomePage'
import useHomeConfig from '@/scenes/home/useHomeConfig'
import trans from '@/consts/trans'
import { useTranslation } from 'react-i18next'

export default memo(({ onResultsChange }: { onResultsChange?: (res?: IHomeSearchResults) => void }) => {
  const [search, setSearch] = useState('')
  const breadcrumbs = useHomeConfig().breadcrumbs
  const breadcrumbsToSearch = useRef<Record<string, string>>({})
  useLayoutEffect(() => {
    if (breadcrumbs?.length) {
      const key = breadcrumbs.join('/')
      const value = breadcrumbsToSearch.current[key] ?? ''
      if (value !== search) {
        setSearch(value)
        calculateSearch(value)
        return
      }
    } else {
      const value = breadcrumbsToSearch.current['home'] ?? ''
      if (value !== search) {
        setSearch(value)
        calculateSearch(value)
        return
      }
    }
  }, [breadcrumbs])
  useEffect(() => {
    if (breadcrumbs?.length) {
      const key = breadcrumbs.join('/')
      breadcrumbsToSearch.current[key] = search
    } else {
      breadcrumbsToSearch.current['home'] = search
    }
  }, [search])
  const calculateSearch = (value?: string) => {
    const query = value ?? search
    if (query) {
      const action = async () => {
        const collections = fuzzysort
          .go(query, CollectionStore.getAll(), {
            key: 'name'
          })
          .map(i => i.obj)
        let metas = !query
          ? MetaStore.getAll({ showLabel: false, showHidden: true })
          : await Global.metaOps.search(query, undefined, { showLabel: false, showHidden: true, onlyName: true })
        onResultsChange?.({
          metas: metas.map(i => i.id),
          collections: Array.from(collections.map(i => i.id))
        })
      }
      action()
    } else {
      onResultsChange?.()
    }
  }
  useDebounceEffect(
    () => {
      calculateSearch()
    },
    [search],
    { wait: 150 }
  )
  const { t } = useTranslation()
  return (
    <div
      style={{
        flex: '0 1 480px'
      }}
      className={'flex h-9 transparent-font overflow-hidden items-center bg-input rounded-lg px-3 py-1.5'}
    >
      <Icon size={16} name={Icons.Search} className={'mr-3'} />
      <BetterInput
        autoFocus
        placeholder={t(trans.Search)}
        className={'flex-1 mr-2 overflow-hidden'}
        value={search}
        onChange={e => {
          setSearch(e.target.value)
          if (!e.target.value) {
            onResultsChange?.()
          }
        }}
      />
    </div>
  )
})
