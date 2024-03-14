import { Content, Icon } from '@/components'
import { useDebounceFn, useGlobalAtom } from '@/hooks'
import { css } from '@emotion/css'
import { atom } from 'jotai'
import { useEffect, useRef, useState } from 'react'
import ClassName from '@/styles/classNames'
import { useTranslation } from 'react-i18next'
import SearchHelper from '@/api/textSearch/SearchHelper'
import SearchHistory from '@/core/search/SearchHistory'
import RecentlyViewed from '@/core/search/RecentlyViewed'
import { ISearchResult } from '@/api/textSearch/types'
import SearchResult from '@/core/search/SearchResult'
import { Colors } from '@/consts'
import { useLatest } from 'react-use'

export const GlobalSearchInputAtom = atom<string>('')

export const GlobalSearchResultsAtom = atom<ISearchResult | undefined>(undefined)

export const SearchDialog = ({ onClose, visible }: { onClose: VoidFunction; visible: boolean }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [searchInput, setSearchInput] = useGlobalAtom(GlobalSearchInputAtom)
  const [searchResults, setSearchResults] = useGlobalAtom(GlobalSearchResultsAtom)
  const { t } = useTranslation()
  const currInput = useLatest(searchInput)
  const { run: debouncedSearch } = useDebounceFn(
    (input: string) => {
      if (input.length) {
        // if (isLoading) return
        setIsLoading(true)
        const curr = Date.now()
        SearchHelper.searchDocument({ queryText: input }).then(res => {
          if (input !== currInput.current) return
          const n = Date.now()
          setTimeout(
            () => {
              setIsLoading(false)
              setSearchResults(res)
            },
            n - curr > 500 ? Math.min(0, n - curr - 500) : 500
          )
        })
      } else {
        setSearchResults([])
      }
    },
    { wait: 500 }
  )

  useEffect(() => {
    debouncedSearch(searchInput)
  }, [searchInput])
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (visible) {
      inputRef.current?.focus()
    }
  }, [visible])
  return (
    <Content
      flex
      column
      className={css([
        {
          width: 800,
          borderRadius: 10,
          maxWidth: 'calc(100vw - 100px)',
          maxHeight: '80vh',
          height: 'auto',
          boxShadow: Colors.Background.BoxShadow,
          overflow: 'hidden'
        }
      ])}
    >
      <Content flex gap={10} alignItems={'center'} style={{ padding: '12px 16px', borderBottom: `1px solid ${Colors.Background.Border}` }}>
        <Icon size={18} name={'park-search'} />
        <input
          placeholder={t('general.search documents')}
          value={searchInput}
          ref={inputRef}
          onChange={e => {
            setSearchInput(e.target.value)
          }}
          className={ClassName.noStyleInput}
          style={{ width: '100%', fontWeight: 'bold', padding: 0 }}
        />
        {searchInput && (
          <Icon name={'park-close'} size={16} className={ClassName.flatButton(4, '4px')} onClick={() => setSearchInput('')} />
        )}
      </Content>
      {!searchInput && (
        <>
          <SearchHistory
            onClick={n => {
              setSearchInput(n)
            }}
          />
          <RecentlyViewed onClose={() => onClose()} />
        </>
      )}
      {isLoading && (
        <div
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 0px'
          }}
        >
          <Icon name={'park-loading-four'} size={20} spin />
        </div>
      )}
      {searchResults && !isLoading && searchInput && <SearchResult enableOpen={visible} onClose={onClose} result={searchResults} />}
    </Content>
  )
}
