import { useState } from 'react'
import { useDebounceEffect } from '@/hooks'
import fetchGoogleNews from '@/core/components/feed/utils/googleNewsScraper'
import { Content, Icon } from '@/components'
import { ObjectStore } from '@/api/stores'
import { ClassName } from 'rendevoz'
import { Colors } from '@/consts'
import { css } from '@emotion/css'
import availableLangs from '../../google/AvailableLangAndRegions.json'
import Select from '@/components/base/select'
import KeyvalueStore from '@/api/stores/keyvalue.store'
import addItems from '@/core/components/feed/utils/addItems'

const GoogleNewsSearch = () => {
  const [searchInput, setSearchInput] = useState('')
  const [searchResults, setSearchResults] = useState<{
    items?: any[]
    url?: string
  }>({})
  const [isLoading, setIsLoading] = useState(false)
  const currentLang = KeyvalueStore.useValue('googleNewsSearchLang') || 'all'

  useDebounceEffect(
    () => {
      if (searchInput) {
        if (isLoading) return
        setIsLoading(true)
        fetchGoogleNews({
          query: searchInput,
          queryVars:
            currentLang === 'all'
              ? undefined
              : {
                  hl: currentLang
                }
        })
          .then(res => {
            console.log(res)
            setSearchResults({
              items: res.items,
              url: res.url
            })
          })
          .finally(() => {
            setIsLoading(false)
          })
      } else {
        setSearchResults([])
      }
    },
    [searchInput],
    { wait: 500 }
  )
  return (
    <Content flex column style={{ padding: '0px 12px' }} fullHeight>
      <Content flex justifyContent={'space-between'} style={{ margin: '12px 0px 0px' }}>
        <div className={ClassName.title()}>Google News Search</div>
        {searchInput && searchResults.items?.length ? (
          <div
            onClick={() => {
              addItems(searchResults.items, {
                name: `${searchInput} - Google News`,
                feedUrl: searchResults.url,
                icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Google_News_icon.svg/2503px-Google_News_icon.svg.png'
              })
            }}
            style={{ color: Colors.Common.SelectColor, cursor: 'pointer' }}
          >
            Follow this search
          </div>
        ) : null}
      </Content>
      <div style={{ fontSize: 13, color: Colors.Font.Transparent, marginBottom: 10 }}>Get up to date google search results</div>
      <Content
        flex
        tabIndex={0}
        className={css({
          transition: 'all 0.2s ease',
          ':focus-within': {
            boxShadow: '0 0 0 2px var(--select-color)'
          }
        })}
        gap={10}
        style={{
          border: `1px solid ${Colors.Background.Border}`,
          padding: '4px 12px',
          borderRadius: 48,
          marginBottom: 8
        }}
      >
        <Icon name={isLoading ? 'park-loading-four' : 'park-search'} spin={isLoading} />
        <input
          placeholder={"Search news"}
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          className={ClassName.noStyleInput}
          style={{
            flex: 1
          }}
        />
        <Select
          menuStyle={{
            maxHeight: 300,
            overflowY: 'auto'
          }}
          onSelect={v => {
            KeyvalueStore.updateOne('googleNewsSearchLang', v[0])
          }}
          closeOnSelect={true}
          value={currentLang || 'zh-cn'}
          options={[
            {
              value: 'all',
              children: 'All languages'
            },
            ...availableLangs.map(i => ({
              children: i.language_name,
              value: i.language_code
            }))
          ]}
        />
      </Content>
      <Content flex column gap={10} style={{ overflowY: 'auto' }} auto>
        {searchResults?.items?.map(i => (
          <div key={i.link} style={{ cursor: 'pointer' }} onClick={() => window.open(i.link)}>
            <div className={ClassName.title()}>{i.title}</div>
            <div className={ClassName.description('13px')} style={{ textTransform: 'uppercase' }}>
              {i.link.replace(/^(?:https?:\/\/)?(?:www\.)?/i, '').split('/')[0]}
            </div>
          </div>
        ))}
      </Content>
    </Content>
  )
}

export default GoogleNewsSearch
