import { Content } from '@/components'
import { useDebounceFn, useGlobalAtom } from '@/hooks'
import { ISearchResultItem, SearchStore, SearchableDocument } from '@/stores/search.store'
import { css } from '@emotion/css'
import { atom } from 'jotai'
import { useEffect } from 'react'
import SearchResultItem from './SearchResultItem'
import BorderInput from '@/components/base/BorderInput'
import SearchAnalysis from './SearchAnalysis'
import ClassName from '@/styles/classNames'

export const GlobalSearchInputAtom = atom<string>('')

export type SearchGroup = {
  id: number
  type: 'pdf' | 'note'
  items: (SearchableDocument & { positions?: ISearchResultItem['positions'] })[]
}
export type SearchGroupMap = Map<number, SearchGroup>
export const GlobalSearchResultsAtom = atom<SearchGroupMap>(new Map())
const getGroupId = (item: SearchableDocument) => {
  return Number(item.targetObjectId)
}
const getGroupType = (item: SearchableDocument) => {
  switch (item.specType) {
    case 'noteBlock':
      return 'note'
    case 'pdfPage':
      return 'pdf'
  }
}
export const SearchDialog = ({ onClose }: { onClose: VoidFunction }) => {
  const [searchInput, setSearchInput] = useGlobalAtom(GlobalSearchInputAtom)
  const [searchResults, setSearchResults] = useGlobalAtom(GlobalSearchResultsAtom)
  const { run: debouncedSearch } = useDebounceFn(
    () => {
      if (searchInput.length) {
        SearchStore.searchDocument({
          query: searchInput,
          specType: 'all'
        }).then(result => {
          // put pdf page -> pdf, note block -> note
          const groupedMap = new Map() as SearchGroupMap
          const addToMap = (item: ISearchResultItem) => {
            const key = getGroupId(item.doc)
            const group = groupedMap.get(key) || {
              items: [],
              type: getGroupType(item.doc),
              id: key
            }
            const arr = group.items
            arr.push({
              ...item.doc,
              positions: item.positions
            })
            groupedMap.set(key, group)
          }
          result.forEach(item => {
            addToMap(item)
          })

          setSearchResults(groupedMap)
        })
      }
    },
    { wait: 50 }
  )

  useEffect(() => {
    debouncedSearch()
  }, [searchInput])

  return (
    <Content
      flex
      column
      gap={10}
      className={css([
        {
          width: 1100,
          padding: '30px 30px 0px',
          borderRadius: 10,
          maxWidth: 'calc(100vw - 200px)',
          height: '80vh',
          '*': {
            textTransform: 'none'
          },
          em: {
            color: 'yellow',
            fontStyle: 'normal'
          }
        },
        ClassName.Background.pseudoBlurContrastBackground
      ])}
    >
      <BorderInput textarea={false} placeholder="Search Something" value={searchInput} onChange={e => setSearchInput(e)} />
      {/* <SearchAnalysis /> */}
      <Content flex column style={{ height: 0, flex: 1, overflowY: 'auto', padding: '0px 50px', margin: '0px -30px' }}>
        {Array.from(searchResults.values()).map(i => (
          <SearchResultItem key={i.id} group={i} onNavi={onClose} />
        ))}
      </Content>
    </Content>
  )
}
