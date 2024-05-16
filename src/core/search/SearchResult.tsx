import { ISearchResult } from '@/api/textSearch/types'
import { Content, VirtualList } from '@/components'
import { Rendevoz } from '@/core/rendevoz'
import { MetaStore } from '@/api/stores'
import { css } from '@emotion/css'
import KeyvalueStore from '@/api/stores/keyvalue.store'
import { useTranslation } from 'react-i18next'
import { useEffect, useRef } from 'react'
import { Virtualizer } from '@tanstack/react-virtual'
import SearchItemRenderer from '@/core/search/SearchItemRenderer'

const SearchResult = ({ result, onClose, enableOpen }: { result: ISearchResult; onClose: VoidFunction; enableOpen: boolean }) => {
  const searchHistory = KeyvalueStore.useValue('searchHistory') || []
  const handleOpenResult = (metaId: number) => {
    if (!enableOpen) return
    Rendevoz.Actions.Open.Meta.openMetaObject(metaId)
    const metaName = MetaStore.getMetaObjectsMap().get(metaId)?.name
    if (metaName) {
      KeyvalueStore.updateOne('searchHistory', [metaName, ...searchHistory.filter(i => i !== metaName).slice(0, 7)])
    }
    onClose()
  }
  const { t } = useTranslation()

  const virtualizerRef = useRef<Virtualizer<any, any>>()
  useEffect(() => {
    virtualizerRef.current?.setFocus(0)
  }, [result])
  return (
    <Content flex column fullHeight>
      {result.length > 0 && (
        <>
          <VirtualList
            ref={virtualizerRef}
            withKeyboardNavigation={enableOpen}
            onSelect={item => {
              handleOpenResult(item.metaId)
            }}
            style={{ width: '100%', height: '100%', marginTop: 6, marginBottom: 6, padding: '0px 6px' }}
            childrenContainerClassname={css({
              '>': {
                ':not(:last-child)': {
                  boxShadow: 'rgba(255, 255, 255, 0.055) 0px 1px 0px'
                },
                ':hover': {
                  boxShadow: 'none'
                },
                '[data-selected="true"]': {
                  boxShadow: 'none'
                },
                ':has(+ div:hover)': {
                  boxShadow: 'none'
                },
                ':has(+ div[data-selected="true"])': {
                  boxShadow: 'none'
                }
              }
            })}
            items={result}
            estimateSize={40}
            renderItem={(item, idx, selected) => (
              <SearchItemRenderer
                onClick={() => {
                  handleOpenResult(item.metaId)
                }}
                hit={item}
                selected={selected}
              />
            )}
          ></VirtualList>
          <Content
            flex
            style={{
              padding: '6px 14px',
              lineHeight: 1
            }}
            className={'border-top bg-secondary transparent-font font-size-12'}
          >
            {t('general.Keyboard navigation and switch tabs')}
          </Content>
        </>
      )}
    </Content>
  )
}

export default SearchResult
