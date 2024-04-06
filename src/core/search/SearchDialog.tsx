import { Content, Icon, Tabs, TabPane } from '@/components'
import { GlobalInstance, useDebounceFn, useGlobalAtom } from '@/hooks'
import { css } from '@emotion/css'
import { atom } from 'jotai'
import { memo, useEffect, useMemo, useRef, useState } from 'react'
import ClassName from '@/styles/classNames'
import { useTranslation } from 'react-i18next'
import SearchHistory from '@/core/search/SearchHistory'
import RecentlyViewed from '@/core/search/RecentlyViewed'
import { ISearchResult } from '@/api/textSearch/types'
import SearchResult from '@/core/search/SearchResult'
import { Colors, KEY } from '@/consts'
import { useLatest } from 'react-use'
import AdvanceSearch from '@/core/search/AppearResults'
import searchGlobalText from '@/core/search/search'
import BetterFilter from '@/core/object/filter/BetterFilter'
import RelatedResults from '@/core/search/RelatedResults'
import { MetaFilterGroup, MetaObject } from '~/typings'
import { calculateFilterObjects } from '@/core/object/filter/useBetterFilter'
import calculateAppearIn from '@/core/search/calculateAppearIn'
import { MetaStore, ObjectStore } from '@/api/stores'
import TagSearch from '@/core/search/TagSearch'
import useSaveFilterModal from '@/core/search/useSaveFilterModal'
import PropSearch from '@/core/search/PropSearch'
import isHotkey from 'is-hotkey'

export const GlobalSearchInputAtom = atom<string>('')

export type GlobalSearchResults = {
  results: ISearchResult
  related?: SearchRelated
}
export const GlobalSearchResultsAtom = atom<GlobalSearchResults | undefined>(undefined)

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
}

const FilterAtom = atom<MetaFilterGroup | undefined>(undefined)
export const SearchDialog = memo(({ onClose, visible }: { onClose: VoidFunction; visible: boolean }) => {
  const [isLoading, setIsLoading] = useState(false)
  const propMeta = MetaStore.useIndexedMetaObjects()?.propToMetaObjectIdsMap
  const propIds = useMemo(() => {
    return propMeta ? Array.from(propMeta.keys()) : []
  }, [propMeta])
  const [tab, setTab] = useState('all')
  const allProps = ObjectStore('metaProp').useMultiple(propIds)
  const [filter, setFilter] = useGlobalAtom(FilterAtom)
  const [filteredObjects, setFilteredObjects] = useState<MetaObject[]>([])
  const [searchInput, setSearchInput] = useGlobalAtom(GlobalSearchInputAtom)
  const [searchResults, setSearchResults] = useGlobalAtom(GlobalSearchResultsAtom)
  const [enableFilter, setEnableFilter] = useState(false)
  const { t } = useTranslation()
  const [isComposing, setIsComposing] = useState(false)
  useEffect(() => {
    // arrow left, arrow right switch tab
    if (visible) {
      const keys = ['all', 'appear in', 'tags', 'props', 'related']
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
    props: number
  }>({
    props: 0,
    all: 0,
    tag: 0,
    related: 0,
    appearIn: 0
  })
  const { renderSave, openSave, renderSaved } = useSaveFilterModal({
    search: searchInput,
    filter,
    onUse: (search, filter1) => {
      setSearchInput(search || '')
      setFilter(filter1)
      if (filter1) {
        setEnableFilter(true)
      }
    }
  })
  const { run: debouncedSearch } = useDebounceFn(
    async (input: string) => {
      if (input.length || filteredObjects.length) {
        setIsLoading(true)
        const n = Date.now()
        let textResults: ISearchResult | undefined = undefined
        if (input) {
          textResults = await searchGlobalText(input)
          console.log(textResults)
        }
        if (filteredObjects && filteredObjects.length > 0) {
          const filteredIds = new Set(filteredObjects.map(i => i.id))
          textResults = textResults
            ? textResults.filter(i => filteredIds.has(i.metaId))
            : filteredObjects.map(i => ({ id: i.id, metaId: i.id, name: i.name || i.placeholderName }))
        }
        if (textResults) {
          const appearIn = await calculateAppearIn(textResults.map(i => i.metaId))
          const metaIdToResultMap = new Map(textResults.map(i => [i.metaId, i]))
          const related: SearchRelated = {
            whiteboard: appearIn.whiteboard.map(i => ({
              parent: { id: i.parent.id, metaId: i.parent.id, name: i.parent.name || i.parent.placeholderName },
              children: i.children.map(c => metaIdToResultMap.get(c.id)).filter(i => i)
            })),
            group: appearIn.group.map(i => ({
              parent: { id: i.parent.id, metaId: i.parent.id, name: i.parent.name || i.parent.placeholderName },
              children: i.children.map(c => metaIdToResultMap.get(c.id)).filter(i => i)
            })),
            pdf: appearIn.pdf.map(i => ({
              parent: { id: i.parent.id, metaId: i.parent.id, name: i.parent.name || i.parent.placeholderName },
              children: i.children.map(c => metaIdToResultMap.get(c.id)).filter(i => i)
            })),
            note: appearIn.note.map(i => ({
              parent: { id: i.parent.id, metaId: i.parent.id, name: i.parent.name || i.parent.placeholderName },
              children: i.children.map(c => metaIdToResultMap.get(c.id)).filter(i => i)
            })),
            audio: appearIn.audio.map(i => ({
              parent: { id: i.parent.id, metaId: i.parent.id, name: i.parent.name || i.parent.placeholderName },
              children: i.children.map(c => metaIdToResultMap.get(c.id)).filter(i => i)
            })),
            webpage: appearIn.webpage.map(i => ({
              parent: { id: i.parent.id, metaId: i.parent.id, name: i.parent.name || i.parent.placeholderName },
              children: i.children.map(c => metaIdToResultMap.get(c.id)).filter(i => i)
            })),
            video: appearIn.video.map(i => ({
              parent: { id: i.parent.id, metaId: i.parent.id, name: i.parent.name || i.parent.placeholderName },
              children: i.children.map(c => metaIdToResultMap.get(c.id)).filter(i => i)
            }))
          }
          console.log(related)
          const msUsed = Date.now() - n
          setTimeout(
            () => {
              setIsLoading(false)
              setSearchResults({
                results: textResults,
                related
              })
              setResultNums(s => ({
                ...s,
                all: textResults?.length || 0,
                appearIn:
                  related.group.length +
                  related.whiteboard.length +
                  related.note.length +
                  related.video.length +
                  related.pdf.length +
                  related.audio.length +
                  related.webpage.length
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
    },
    { wait: 500 }
  )

  useEffect(() => {
    if (!isComposing) {
      debouncedSearch(searchInput)
    }
  }, [searchInput, isComposing, filteredObjects.length])
  useEffect(() => {
    if (enableFilter) {
      if (filter) {
        const filtered = calculateFilterObjects(filter, undefined, true)
        setFilteredObjects(filtered || [])
      } else {
        setFilteredObjects([])
      }
    } else {
      setFilteredObjects([])
    }
  }, [filter, enableFilter])
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (visible) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [visible])
  let fixedHeight = false
  if (searchResults?.results.length) {
    if (!searchInput && !(filteredObjects.length > 0)) {
      fixedHeight = false
    } else {
      fixedHeight = true
    }
  }
  if (isLoading && searchResults?.results.length) {
    fixedHeight = true
  }
  let showPlaceholder = false
  if ((enableFilter || searchInput) && !searchResults?.results.length) {
    showPlaceholder = true
  }
  if (isLoading) {
    showPlaceholder = false
  }
  return (
    <>
      {renderSave()}
      <Content
        flex
        column
        className={css([
          {
            width: 800,
            borderRadius: 10,
            maxWidth: 'calc(100vw - 100px)',
            maxHeight: '80vh',
            height: fixedHeight ? '80vh' : 'auto',
            boxShadow: Colors.Background.BoxShadow,
            overflow: 'hidden'
          }
        ])}
      >
        <Content flex gap={10} alignItems={'center'} style={{ padding: '8px 12px', borderBottom: `1px solid ${Colors.Background.Border}` }}>
          <input
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            placeholder={t('general.Type to search') + '...'}
            value={searchInput}
            ref={inputRef}
            onChange={e => {
              setSearchInput(e.target.value)
            }}
            onKeyDown={e => {
              if (isHotkey(KEY.Escape, e)) {
                GlobalInstance.searchOps?.closeSearchPanel()
              }
            }}
            style={{ width: '100%', fontWeight: 'bold', padding: 0 }}
          />
          <Icon onClick={() => setEnableFilter(!enableFilter)} className={ClassName.flatButton(4, '4px')} name={'park-filter'} />
          {(searchInput || enableFilter) && (
            <Icon className={ClassName.flatButton(4, '4px')} name={'park-save'} onClick={() => openSave()} />
          )}
          {(searchInput || enableFilter) && (
            <Icon
              name={'park-close'}
              size={16}
              className={ClassName.flatButton(4, '4px')}
              onClick={() => {
                setSearchInput('')
                setFilter(undefined)
                setEnableFilter(false)
              }}
            />
          )}
        </Content>
        {enableFilter && (
          <div style={{ width: '100%', padding: 8, flexShrink: 0 }} className={'border-bottom'}>
            <BetterFilter
              extraFields={allProps.map(i => ({
                icon: i.icon,
                name: i.name,
                propType: i.propType,
                value: i.id
              }))}
              showHiddenMetas={true}
              root={filter}
              onChange={v => setFilter(v)}
            />
          </div>
        )}
        {!searchInput && !enableFilter && (
          <Content style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            {renderSaved()}
            <SearchHistory
              onClick={n => {
                setSearchInput(n)
              }}
            />
            <RecentlyViewed visible={visible} onClose={() => onClose()} />
          </Content>
        )}
        {showPlaceholder ? (
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
              padding: '40px 0px',
              height: '100%'
            }}
          >
            <Icon name={'park-loading-four'} size={20} spin />
          </div>
        )}
        {fixedHeight && !isLoading && searchResults && (
          <Tabs
            style={{
              overflow: 'hidden'
            }}
            tabNavContainerStyle={{
              padding: '6px',
              fontSize: 16,
              fontWeight: 600,
              borderBottom: Colors.Consts.Border
            }}
            activeKey={tab}
            onTabClick={k => setTab(k)}
          >
            <TabPane key={'all'} tab={t('general.All') + (resultNums.all ? `(${resultNums.all})` : '')}>
              <SearchResult enableOpen={visible} onClose={onClose} result={searchResults.results} />
            </TabPane>
            <TabPane key={'appear in'} tab={t('general.Appear in') + (resultNums.appearIn ? `(${resultNums.appearIn})` : '')}>
              <AdvanceSearch related={searchResults.related} />
            </TabPane>
            <TabPane key={'tags'} tab={t('general.Tags') + (resultNums.tag ? `(${resultNums.tag})` : '')}>
              <TagSearch onNumChange={v => setResultNums(s => ({ ...s, tag: v }))} results={searchResults.results} />
            </TabPane>
            <TabPane key={'props'} tab={t('general.Properties') + (resultNums.props ? `(${resultNums.props})` : '')}>
              <PropSearch onNumChange={v => setResultNums(s => ({ ...s, props: v }))} results={searchResults.results} />
            </TabPane>
            <TabPane key={'related'} tab={t('general.related') + (resultNums.related ? `(${resultNums.related})` : '')}>
              <RelatedResults onNumChange={v => setResultNums(s => ({ ...s, related: v }))} results={searchResults.results} />
            </TabPane>
          </Tabs>
        )}
      </Content>
    </>
  )
})
