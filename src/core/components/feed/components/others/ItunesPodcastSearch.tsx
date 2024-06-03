import { useState } from 'react'
import { Content, Icon } from '@/components'
import { ClassName } from 'rendevoz'
import { useDebounceEffect } from '@/hooks'
import fetchFeedAndAddCollection from '@/core/components/feed/utils/fetchFeedAndAddCollection'
import { Colors } from '@/consts'
import { css } from '@emotion/css'
import { useTranslation } from 'react-i18next'

export type ITunesSearchResult = {
  genres: string[]
  genreIds: string[]
  releaseDate: string
  feedUrl: string
  collectionName: string
  artistName: string
}

export default () => {
  const [isLoading, setIsLoading] = useState(false)
  const [searchResult, setSearchResult] = useState<ITunesSearchResult[]>([])
  const [searchInput, setSearchInput] = useState('')
  const { t } = useTranslation()
  useDebounceEffect(
    () => {
      if (searchInput) {
        if (!isLoading) {
          setIsLoading(true)
          fetch(`https://itunes.apple.com/search?term=${searchInput}&country=US&media=podcast`)
            .then(res => res.json())
            .then(j => setSearchResult(j.results))
            .finally(() => {
              setIsLoading(false)
            })
        }
      } else {
        setSearchResult([])
      }
    },
    [searchInput],
    { wait: 500 }
  )
  return (
    <Content flex column fullHeight gap={10} style={{ padding: '16px 16px 0px' }}>
      <Content
        flex
        tabIndex={0}
        className={'focus-within-input border-box-shadow'}
        gap={10}
        style={{
          padding: '6px 12px',
          borderRadius: 48,
          marginBottom: 8
        }}
      >
        <Icon name={isLoading ? 'park-loading-four' : 'park-search'} spin={isLoading} />
        <input
          autoFocus
          placeholder={t('general.Type to search') + '...'}
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          className={ClassName.noStyleInput}
          style={{
            flex: 1
          }}
        />
      </Content>
      <Content flex column gap={4} auto style={{ overflowY: 'auto', paddingBottom: 100 }}>
        {searchResult.map(i => (
          <Content
            key={i.feedUrl}
            onClick={() => {
              fetchFeedAndAddCollection(i.feedUrl, 'podcast')
            }}
            className={'button'}
          >
            <div style={{ fontWeight: 600, fontSize: 16 }}>{i.collectionName}</div>
            <div style={{ fontSize: 13, color: Colors.Font.Transparent }}>{i.artistName}</div>
          </Content>
        ))}
      </Content>
    </Content>
  )
}
