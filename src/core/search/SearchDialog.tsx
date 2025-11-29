import { Content, Icon, Tabs, TabPane, IconWithPopover, WithBorder, BetterInput } from '@/components'
import { useDebounceFn, useGlobalAtom, useMemoizedFn } from '@/hooks'
import { css } from '@emotion/css'
import { atom } from 'jotai'
import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ISearchResult } from '@/api/textSearch/types'
import SearchResult from '@/core/search/SearchResult'
import { Colors, Icons, KEY } from '@/consts'
import AdvanceSearch from '@/core/search/AppearResults'
import searchGlobalText from '@/core/search/search'
import BetterFilter from '@/core/object/filter/BetterFilter'
import RelatedResults from '@/core/search/RelatedResults'
import { MetaFilterGroup, MetaObject } from '~/typings'
import calculateAppearIn from '@/core/search/calculateAppearIn'
import { MetaStore, ObjectStore } from '@/api/stores'
import TagSearch from '@/core/search/TagSearch'
import PropSearch from '@/core/search/PropSearch'
import isHotkey from 'is-hotkey'
import useSearchHistory from '@/core/search/useSearchHistory'
import { Tab } from '@/components/base/tabs'
import classnames from 'classnames'
import TypeSearch from '@/core/search/TypeSearch'
import SearchActionPanel from '@/core/search/SearchActionPanel'
import { sum } from 'lodash'

export type ISearchMode = 'search' | 'new' | 'folder' | 'page' | 'workspace' | 'create' | 'view' | 'history'
const SearchAtom = atom<string>('')
const ModeAtom = atom<ISearchMode>('search')
export type GlobalSearchResults = {
  results: ISearchResult
  related?: SearchRelated
}
const ResultsAtom = atom<GlobalSearchResults | undefined>(undefined)

export type SearchRelatedResult = {
  parent: ISearchResult[0]
  children: ISearchResult
}

export type SearchRelated = {
  whiteboard: SearchRelatedResult[]
  group: SearchRelatedResult[]
  note: SearchRelatedResult[]
  webpage: SearchRelatedResult[]
  audio: SearchRelatedResult[]
  video: SearchRelatedResult[]
  pdf: SearchRelatedResult[]
  attachment: SearchRelatedResult[]
}

const FilterAtom = atom<MetaFilterGroup | undefined>(undefined)
const SearchDialog = memo(({ onClose, visible }: { onClose: VoidFunction; visible: boolean }) => {
  const [isLoading, setIsLoading] = useState(false)
  const propMeta = MetaStore.useIndexedMetaObjects()?.propToMetaObjectIdsMap
  const propIds = useMemo(() => {
    return propMeta ? Array.from(propMeta.keys()) : []
  }, [propMeta])
  const [tab, setTab] = useState('all')
  const allProps = ObjectStore('metaProp').useMultiple(propIds)
  const [filter, setFilter] = useGlobalAtom(FilterAtom)
  const [mode, setMode] = useGlobalAtom(ModeAtom)
  const [filteredObjects, setFilteredObjects] = useState<MetaObject[]>()
  const [searchInput, setSearchInput] = useGlobalAtom(SearchAtom)
  const [searchResults, setSearchResults] = useGlobalAtom(ResultsAtom)
  const { t } = useTranslation()
  const { updateHistory } = useSearchHistory()
  useEffect(() => {
    // arrow left, arrow right switch tab
    if (visible) {
      const keys = ['all', 'type', 'appear in', 'tags', 'props']
      const keydownHandler = (e: KeyboardEvent) => {
        if (isHotkey('mod+arrowright', e)) {
          e.preventDefault()
          e.stopPropagation()
          const idx = keys.indexOf(tab)
          const next = idx + 1 >= keys.length ? 0 : idx + 1
          setTab(keys[next])
        }
        if (isHotkey('mod+arrowleft', e)) {
          e.preventDefault()
          e.stopPropagation()
          const idx = keys.indexOf(tab)
          const next = idx - 1 < 0 ? keys.length - 1 : idx - 1
          setTab(keys[next])
        }
      }
      document.addEventListener('keydown', keydownHandler, true)
      return () => {
        document.removeEventListener('keydown', keydownHandler, true)
      }
    }
  }, [visible, tab])
  const [resultNums, setResultNums] = useState<{
    tag: number
    related: number
    appearIn: number
    all: number
    contains: number
    props: number
    type: number
  }>({
    type: 0,
    props: 0,
    all: 0,
    contains: 0,
    tag: 0,
    related: 0,
    appearIn: 0
  })
  useLayoutEffect(() => {
    inputRef.current?.focus()
  }, [mode])
  const searchFunc = useMemoizedFn(async (input: string) => {
    if (mode !== 'search' && mode !== 'history') return
    if ((input.length || filteredObjects?.length) && !input?.startsWith('/')) {
      setIsLoading(true)
      const n = Date.now()
      let textResults: ISearchResult | undefined = undefined
      if (input) {
        textResults = await searchGlobalText(input, false)
      }
      if (filteredObjects && filteredObjects.length > 0) {
        const filteredIds = new Set(filteredObjects.map(i => i.id))
        textResults = textResults
          ? textResults.filter(i => filteredIds.has(i.metaId))
          : filteredObjects.map(i => ({ id: i.id, metaId: i.id, name: i.name || i.placeholderName }))
      }
      if (textResults) {
        textResults = textResults.filter(i => MetaStore.isVisibleMetaObject(i.metaId, { showLabel: true, showHidden: true }))
        const appearIn = await calculateAppearIn(textResults.map(i => i.metaId))
        const metaIdToResultMap = new Map(textResults.map(i => [i.metaId, i]))
        const related: SearchRelated = Object.fromEntries(
          Object.entries(appearIn).map(entry => [
            entry[0],
            entry[1].map(i => ({
              parent: { id: i.parent.id, metaId: i.parent.id, name: i.parent.name || i.parent.placeholderName },
              children: i.children.map(c => metaIdToResultMap.get(c.id)).filter(i => i)
            }))
          ])
        )
        const msUsed = Date.now() - n
        setTimeout(
          () => {
            setIsLoading(false)
            setSearchResults({
              results: textResults,
              related
            })
            if (textResults?.length) {
              if (input.length) {
                updateHistory(c => [input, ...c.filter(o => o !== input)])
              }
            }
            setResultNums(s => ({
              ...s,
              all: textResults?.length || 0,
              appearIn: sum(Object.values(related).map(i => i.length))
            }))
          },
          Math.max(500 - msUsed, 0)
        )
        return
      }
      const msUsed = Date.now() - n
      setTimeout(
        () => {
          setIsLoading(false)
        },
        Math.max(500 - msUsed, 0)
      )
    } else {
      setSearchResults(undefined)
    }
  })
  const debouncedSearch = useDebounceFn(searchFunc, { wait: 500 })

  useLayoutEffect(() => {
    if (searchInput) {
      debouncedSearch.run(searchInput)
    } else {
      searchFunc('')
      debouncedSearch.cancel()
    }
  }, [searchInput])
  useEffect(() => {
    searchFunc(searchInput)
    debouncedSearch.cancel()
  }, [filteredObjects])
  useEffect(() => {
    if (filter?.rules.length) {
      Global.metaOps.filter(filter, undefined, { showAll: true }).then(filtered => {
        setFilteredObjects(filtered || [])
      })
    } else {
      setFilteredObjects(undefined)
    }
  }, [filter])
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (visible) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [visible])
  let fixedHeight = false
  if (searchResults?.results.length) {
    if (!searchInput && !filteredObjects?.length) {
      fixedHeight = false
    } else {
      fixedHeight = true
    }
  }
  if (isLoading && searchResults?.results.length) {
    fixedHeight = true
  }
  let showPlaceholder = false
  const showAction = (mode !== 'search' && mode !== 'history') || searchInput.startsWith('/')
  if (searchInput && !searchResults?.results.length) {
    showPlaceholder = true
  }
  if (filter?.rules.length && (!filteredObjects?.length || !searchResults?.results.length)) {
    showPlaceholder = true
  }
  if (isLoading) {
    showPlaceholder = false
  }
  if (showAction) {
    showPlaceholder = false
  }
  return (
    <>
      <Content
        flex
        column
        className={css({
          width: 800,
          borderRadius: 10,
          maxWidth: 'calc(100vw - 100px)',
          maxHeight: '80vh',
          height: fixedHeight ? '1200px' : 'auto',
          boxShadow: Colors.Background.BoxShadow,
          overflow: 'hidden'
        })}
      >
        <div className={'font-size-15 flex gap-3 border-bottom items-center'} style={{ padding: '8px 12px' }}>
          <BetterInput
            placeholder={mode === 'search' ? t('general.Type to search') : t('general.Search commands, or press ESC to return')}
            value={searchInput}
            ref={inputRef}
            onChange={e => {
              const value = e.target.value
              switch (value) {
                case '/h':
                  setMode('history')
                  break
                case '/n':
                  setMode('new')
                  break
                case '/f':
                  setMode('folder')
                  break
                case '/v':
                  setMode('view')
                  break
                case '/c':
                  setMode('create')
                  break
                case '/p':
                  setMode('page')
                  break
                case '/w':
                  setMode('workspace')
                  break
                default: {
                  setSearchInput(e.target.value)
                  return
                }
              }
              setSearchInput('')
            }}
            onKeyDown={e => {
              if (isHotkey(KEY.Escape, e)) {
                if (mode !== 'search') {
                  e.preventDefault()
                  setMode('search')
                  setSearchInput('')
                  return
                }
                Global.searchOps?.closeSearchPanel()
              }
            }}
            className={'font-medium w-full'}
          />
        </div>
        {!showPlaceholder && !isLoading && !fixedHeight ? (
          <>
            <SearchActionPanel
              onSearch={s => {
                setSearchInput(s)
                searchFunc(s)
                setTimeout(() => debouncedSearch.cancel())
              }}
              visible={visible}
            />
          </>
        ) : null}
        {showPlaceholder && !showAction ? (
          <Content fullWidth style={{ padding: 16, color: Colors.Font.Transparent, fontWeight: 500 }} flex gap={12}>
            <Icon name={'park-emotion-unhappy'} />
            <div>{t('general.Search no result')}</div>
          </Content>
        ) : null}
        {isLoading && (
          <div
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '400px'
            }}
          >
            <Icon name={'park-loading-four'} size={48} spin />
          </div>
        )}
        {fixedHeight && !isLoading && searchResults && (
          <div className={'flex-1 w-full overflow-hidden'}>
            <Tabs
              tabNavMode={'underline'}
              tabNavClassname={'shrink-0 !px-3.5 !py-1.5'}
              defaultActiveKey={'details'}
              tabNavLeftClassName={'!flex-nowrap pl-2'}
              tabNavContainerClassname={
                'no-scrollbar w-full shrink-0 overflow-x-auto capitalize font-medium !justify-normal z-10 border-bottom mt-1'
              }
              mountAll
              activeKey={tab}
              onTabClick={k => setTab(k)}
            >
              <TabPane key={'all'} tab={<Tab text={t('general.All')} count={resultNums.all} />}>
                <SearchResult enableOpen={visible} onClose={onClose} result={searchResults.results} />
              </TabPane>
              <TabPane key={'type'} tab={<Tab count={resultNums.type} text={t('general.Types')} />}>
                <TypeSearch results={searchResults.results} onNumChange={v => setResultNums(s => ({ ...s, type: v }))} />
              </TabPane>
              <TabPane key={'appear in'} tab={<Tab count={resultNums.appearIn} text={t('general.Appear in')} />}>
                <AdvanceSearch related={searchResults.related} />
              </TabPane>
              <TabPane key={'tags'} tab={<Tab count={resultNums.tag} text={t('general.Tags')} />}>
                <TagSearch onNumChange={v => setResultNums(s => ({ ...s, tag: v }))} results={searchResults.results} />
              </TabPane>
              <TabPane key={'props'} tab={<Tab text={t('general.Properties')} count={resultNums.props} />}>
                <PropSearch onNumChange={v => setResultNums(s => ({ ...s, props: v }))} results={searchResults.results} />
              </TabPane>
            </Tabs>
          </div>
        )}
      </Content>
    </>
  )
})

export default { ...SearchDialog, search: SearchAtom, filter: FilterAtom, mode: ModeAtom } as typeof SearchDialog & {
  search: typeof SearchAtom
  filter: typeof FilterAtom
  mode: typeof ModeAtom
}
